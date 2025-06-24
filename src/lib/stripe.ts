import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Server-side Stripe instance
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const createPaymentIntent = async (amount: number) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}; 