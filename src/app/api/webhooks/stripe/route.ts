import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import { sendOrderConfirmationEmail, sendPaymentConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

async function updateOrderStatus(orderId: string, status: 'paid' | 'payment_failed') {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  order.status = status;
  await order.save();
  return order;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        // Update order status
        const order = await updateOrderStatus(orderId, 'paid');

        // Create transaction record
        const transaction = new Transaction({
          orderId: order._id,
          userId: order.userId,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: 'stripe',
          status: 'completed',
          paymentIntentId: paymentIntent.id,
        });
        await transaction.save();

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(
          order.reference,
          order.shippingDetails.email,
          order.shippingDetails.firstName
        );

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        // Update order status
        const order = await updateOrderStatus(orderId, 'payment_failed');

        // Create failed transaction record
        const transaction = new Transaction({
          orderId: order._id,
          userId: order.userId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: 'stripe',
          status: 'failed',
          paymentIntentId: paymentIntent.id,
          errorMessage: paymentIntent.last_payment_error?.message,
        });
        await transaction.save();

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 