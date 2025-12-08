import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, custom_donation');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const amount = req.headers.custom_donation as string;
        const donationAmount = amount ? parseInt(amount) : 10;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Donation',
                        },
                        unit_amount: donationAmount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://routime.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://routime.vercel.app/`,
        });

        return res.status(200).json({
            url: session.url
        });
    } catch (error) {
        console.error('Checkout session error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'An error occurred'
        });
    }
}
