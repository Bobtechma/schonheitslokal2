import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

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

    const { sessionId } = request.body;
    if (!sessionId) {
        return response.status(400).json({ error: 'Session ID is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;

    if (!supabaseUrl || !serviceRoleKey || !smtpUser || !smtpPass) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // 1. Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session || session.payment_status !== 'paid') {
            return response.status(400).json({ error: 'Session not paid or invalid' });
        }

        const orderId = session.metadata?.order_id;
        const paymentStage = session.metadata?.payment_stage;
        const userLanguage = session.metadata?.language || 'de-CH';

        if (!orderId) {
            return response.status(400).json({ error: 'Order ID missing in session metadata' });
        }

        // 2. Fetch order details from database
        const { data: order, error: orderError } = await supabase
            .from('partner_orders')
            .select(`
                *,
                items:partner_order_items(
                    quantity,
                    price_at_time,
                    product:services(name, name_pt, name_de)
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return response.status(404).json({ error: 'Order not found' });
        }

        // Get system currency settings
        const { data: currencySetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'currency')
            .maybeSingle();
        const currency = (currencySetting?.value || 'CHF').toUpperCase();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const origin = request.headers.origin || 'https://schoenheitslokal.ch';
        const secondHalfPaymentUrl = `${origin}/pagar-saldo?orderId=${order.id}`;

        if (paymentStage === 'first') {
            // Update order status if not already updated
            if (order.status === 'pending') {
                const { error: updateError } = await supabase
                    .from('partner_orders')
                    .update({ status: 'paid_first' })
                    .eq('id', orderId);

                if (updateError) throw updateError;
            }

            // Send Upfront Confirmation Email (First 50%)
            const isPt = userLanguage === 'pt-BR';
            const subject = isPt 
                ? `Confirmação de Pedido de Parceiro - 1ª Parcela Paga`
                : `Partnerbestellung Bestätigung - 1. Rate bezahlt`;

            const itemsHtml = order.items.map((item: any) => {
                const name = isPt 
                    ? (item.product?.name_pt || item.product?.name)
                    : (item.product?.name_de || item.product?.name);
                return `<li>${name} - Qtd: ${item.quantity} - ${currency} ${(item.price_at_time * item.quantity).toFixed(2)}</li>`;
            }).join('');

            const emailHtml = isPt ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                    <h2 style="color: #ec4899;">Parabéns! Recebemos seu pedido de parceiro</h2>
                    <p>Olá,</p>
                    <p>Confirmamos o pagamento da primeira parcela (50%) do seu pedido de salão parceiro.</p>
                    <p><strong>Detalhes do Pedido:</strong></p>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    <p><strong>Resumo Financeiro:</strong></p>
                    <ul>
                        <li>Total original: ${currency} ${Number(order.original_total).toFixed(2)}</li>
                        <li>Desconto aplicado (${order.discount_pct}%): -${currency} ${(Number(order.original_total) - Number(order.discounted_total)).toFixed(2)}</li>
                        <li>Total com desconto: ${currency} ${Number(order.discounted_total).toFixed(2)}</li>
                        <li>Valor pago (50% entrada): <strong>${currency} ${Number(order.amount_upfront).toFixed(2)}</strong></li>
                        <li>Saldo pendente (50% em 30 dias): <strong>${currency} ${Number(order.amount_due_30_days).toFixed(2)}</strong></li>
                    </ul>
                    <hr style="border: 0; border-top: 1px border #e5e7eb; margin: 20px 0;">
                    <h3 style="color: #ec4899;">Link para Pagamento do Saldo (30 dias)</h3>
                    <p>Para pagar os 50% restantes a qualquer momento nos próximos 30 dias, clique no link seguro abaixo:</p>
                    <p>
                        <a href="${secondHalfPaymentUrl}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Pagar Segunda Parcela (50%)
                        </a>
                    </p>
                    <p>Link direto: <a href="${secondHalfPaymentUrl}">${secondHalfPaymentUrl}</a></p>
                    <p>Seu pedido será preparado e despachado em breve.</p>
                    <p>Atenciosamente,<br>Equipe Schönheitslokal</p>
                </div>
            ` : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                    <h2 style="color: #ec4899;">Glückwunsch! Wir haben Ihre Partnerbestellung erhalten</h2>
                    <p>Hallo,</p>
                    <p>Wir bestätigen den Zahlungseingang der ersten Rate (50%) Ihrer Partnerbestellung.</p>
                    <p><strong>Bestelldetails:</strong></p>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    <p><strong>Zusammenfassung:</strong></p>
                    <ul>
                        <li>Original-Total: ${currency} ${Number(order.original_total).toFixed(2)}</li>
                        <li>Rabatt (${order.discount_pct}%): -${currency} ${(Number(order.original_total) - Number(order.discounted_total)).toFixed(2)}</li>
                        <li>Total mit Rabatt: ${currency} ${Number(order.discounted_total).toFixed(2)}</li>
                        <li>Bezahlt (50% Anzahlung): <strong>${currency} ${Number(order.amount_upfront).toFixed(2)}</strong></li>
                        <li>Ausstehend (50% in 30 Tagen): <strong>${currency} ${Number(order.amount_due_30_days).toFixed(2)}</strong></li>
                    </ul>
                    <hr style="border: 0; border-top: 1px border #e5e7eb; margin: 20px 0;">
                    <h3 style="color: #ec4899;">Link für die Restzahlung (30 Tage)</h3>
                    <p>Um die restlichen 50% jederzeit innerhalb der nächsten 30 Tage zu bezahlen, klicken Sie bitte auf den untenstehenden Link:</p>
                    <p>
                        <a href="${secondHalfPaymentUrl}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Zweite Rate bezahlen (50%)
                        </a>
                    </p>
                    <p>Direktlink: <a href="${secondHalfPaymentUrl}">${secondHalfPaymentUrl}</a></p>
                    <p>Ihre Bestellung wird in Kürze vorbereitet und versendet.</p>
                    <p>Mit freundlichen Grüßen,<br>Ihr Schönheitslokal Team</p>
                </div>
            `;

            await transporter.sendMail({
                from: `"Schönheitslokal" <${smtpUser}>`,
                to: session.customer_details?.email || order.user_email || '',
                subject: subject,
                html: emailHtml
            });

        } else if (paymentStage === 'second') {
            // Update order status if not already updated
            if (order.status === 'paid_first') {
                const { error: updateError } = await supabase
                    .from('partner_orders')
                    .update({ status: 'fully_paid' })
                    .eq('id', orderId);

                if (updateError) throw updateError;
            }

            // Send Final Confirmation Email (fully paid)
            const isPt = userLanguage === 'pt-BR';
            const subject = isPt 
                ? `Pedido de Parceiro Quitado - Recebemos o Pagamento Final`
                : `Partnerbestellung vollständig bezahlt - Restzahlung erhalten`;

            const emailHtml = isPt ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                    <h2 style="color: #ec4899;">Obrigado! Pedido Quitado</h2>
                    <p>Olá,</p>
                    <p>Confirmamos o recebimento da segunda e última parcela (50%) do seu pedido de salão parceiro (Código: #${order.id.slice(0, 8)}).</p>
                    <p>Seu pedido agora está totalmente pago. Agradecemos pela parceria continuada!</p>
                    <p>Atenciosamente,<br>Equipe Schönheitslokal</p>
                </div>
            ` : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                    <h2 style="color: #ec4899;">Vielen Dank! Bestellung bezahlt</h2>
                    <p>Hallo,</p>
                    <p>Wir bestätigen den Erhalt der zweiten und letzten Rate (50%) Ihrer Partnerbestellung (Code: #${order.id.slice(0, 8)}).</p>
                    <p>Ihre Bestellung ist nun vollständig bezahlt. Vielen Dank für die fortlaufende Partnerschaft!</p>
                    <p>Mit freundlichen Grüßen,<br>Ihr Schönheitslokal Team</p>
                </div>
            `;

            await transporter.sendMail({
                from: `"Schönheitslokal" <${smtpUser}>`,
                to: session.customer_details?.email || order.user_email || '',
                subject: subject,
                html: emailHtml
            });
        }

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error('Error confirming partner payment:', error);
        return response.status(500).json({ error: 'Internal server error', details: (error as any).message });
    }
}
