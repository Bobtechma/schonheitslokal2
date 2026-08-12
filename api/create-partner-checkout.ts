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

    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return response.status(401).json({ error: 'Missing authorization header' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');

    try {
        // 1. Get authenticated user and verify partner role
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return response.status(401).json({ error: 'Invalid token' });
        }

        const role = user.app_metadata?.role || user.user_metadata?.role;
        const allowedRoles = ['partner', 'admin', 'owner'];
        if (!allowedRoles.includes(role)) {
            return response.status(403).json({ error: 'Forbidden: Partner access required' });
        }

        const { items, payment_method } = request.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return response.status(400).json({ error: 'Selected items are required' });
        }

        // 2. Fetch products and settings from DB
        const productIds = items.map(i => i.id);
        const { data: dbProducts, error: prodError } = await supabase
            .from('services')
            .select('*')
            .in('id', productIds)
            .eq('category', 'product')
            .eq('active', true);

        if (prodError || !dbProducts || dbProducts.length === 0) {
            return response.status(400).json({ error: 'Error fetching products or products not found' });
        }

        const productsMap = dbProducts.reduce((acc: any, curr: any) => {
            acc[curr.id] = curr;
            return acc;
        }, {});

        // Calculate original total and item mapping
        let original_total = 0;
        for (const item of items) {
            const prod = productsMap[item.id];
            if (!prod) {
                return response.status(400).json({ error: `Product with ID ${item.id} not found or inactive` });
            }
            original_total += Number(prod.price) * Number(item.quantity);
        }

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', ['partner_discount_pct', 'partner_min_order_amount', 'currency']);

        if (settingsError) {
            return response.status(500).json({ error: 'Failed to retrieve system settings' });
        }

        const settings = (settingsData || []).reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const discount_pct = Number(settings['partner_discount_pct'] || '30');
        const min_order_amount = Number(settings['partner_min_order_amount'] || '100.00');
        const system_currency = (settings['currency'] || 'CHF').toUpperCase();

        // 3. Business rule validation: Minimum order amount
        if (original_total < min_order_amount) {
            return response.status(400).json({ 
                error: `Minimum order amount of ${min_order_amount} ${system_currency} not reached. Current total: ${original_total} ${system_currency}` 
            });
        }

        // Calculate split payments
        const discounted_total = original_total * (1 - discount_pct / 100);
        const amount_upfront = discounted_total * 0.5;
        const amount_due_30_days = discounted_total * 0.5;

        // 4. Create database records
        const { data: order, error: orderError } = await supabase
            .from('partner_orders')
            .insert({
                user_id: user.id,
                original_total,
                discount_pct,
                discounted_total,
                amount_upfront,
                amount_due_30_days,
                status: 'pending',
                payment_method: 'credit_card',
                contract_accepted: true,
                contract_accepted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order Insert Error:', orderError);
            return response.status(500).json({ error: 'Failed to create partner order', details: orderError?.message });
        }

        // Insert order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: productsMap[item.id].price
        }));

        const { error: itemsError } = await supabase
            .from('partner_order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order Items Insert Error:', itemsError);
            // Rollback order
            await supabase.from('partner_orders').delete().eq('id', order.id);
            return response.status(500).json({ error: 'Failed to save partner order items', details: itemsError.message });
        }

        // 5. Create Stripe Checkout Session (First 50%)
        const successUrl = `${request.headers.origin || 'http://localhost:5173'}/confirmacao?partner_session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${request.headers.origin || 'http://localhost:5173'}/parceria`;

        const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'], // Twint can be enabled in Stripe Dashboard dynamic payment methods, or standard card
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: system_currency.toLowerCase(),
                        unit_amount: Math.round(amount_upfront * 100),
                        product_data: {
                            name: `Entrada Cartão (50%) - Pedido #${order.id.slice(0, 8)}`,
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
                payment_stage: 'first'
            }
        };

        const session = await stripe.checkout.sessions.create(stripeSessionParams);

        // Update order with the stripe session ID
        await supabase
            .from('partner_orders')
            .update({ stripe_session_id_first: session.id })
            .eq('id', order.id);

        return response.status(200).json({ sessionUrl: session.url });

    } catch (error) {
        console.error('Error creating partner checkout:', error);
        return response.status(500).json({ error: 'Internal server error', details: (error as any).message });
    }
}
