import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover', // Use latest or pinned version
});

console.log('Initializing Stripe with key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 8));

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, currency = 'chf', metadata } = request.body;

    if (!amount) {
        return response.status(400).json({ error: 'Amount is required' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: metadata // Pass metadata to Stripe
        });

        return response.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return response.status(500).json({ error: 'Failed to create payment intent', details: (error as any).message });
    }
}
