import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { orderId } = request.body;
    if (!orderId) {
        return response.status(400).json({ error: 'Order ID is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // 1. Fetch order details from database
        const { data: order, error: orderError } = await supabase
            .from('partner_orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return response.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'paid_first') {
            return response.status(400).json({ 
                error: `Invalid order status. Order must be paid upfront before paying the remaining balance. Current status: ${order.status}` 
            });
        }

        // Fetch settings for currency
        const { data: settingsData } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['currency']);

        const settings = (settingsData || []).reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const system_currency = (settings['currency'] || 'CHF').toUpperCase();

        const successUrl = `${request.headers.origin || 'http://localhost:5173'}/confirmacao?partner_session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${request.headers.origin || 'http://localhost:5173'}/parceria`;

        const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: system_currency.toLowerCase(),
                        unit_amount: Math.round(Number(order.amount_due_30_days) * 100),
                        product_data: {
                            name: `Saldo Final Cartão (50%) - Pedido #${order.id.slice(0, 8)}`,
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                order_id: order.id,
                payment_stage: 'second'
            }
        };

        const session = await stripe.checkout.sessions.create(stripeSessionParams);

        // Update order with the second stripe session ID
        await supabase
            .from('partner_orders')
            .update({ stripe_session_id_second: session.id })
            .eq('id', order.id);

        return response.status(200).json({ sessionUrl: session.url });

    } catch (error) {
        console.error('Error creating second payment checkout:', error);
        return response.status(500).json({ error: 'Internal server error', details: (error as any).message });
    }
}
