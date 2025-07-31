import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import TempOrder from '@/backend/models/TempOrder';
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

export async function POST(req: NextRequest) {
  console.log('[Stripe Webhook] Handler triggered');
  console.log('[Stripe Webhook] Headers:', Object.fromEntries(req.headers.entries()));
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Read the raw body as a buffer
  const rawBody = await req.arrayBuffer();
  const buf = Buffer.from(rawBody);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);
    console.log('[Stripe Webhook] Event constructed successfully:', event.type);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    console.error('[Stripe Webhook] Webhook secret length:', webhookSecret?.length);
    console.error('[Stripe Webhook] Signature header:', sig);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    console.log('[Stripe Webhook] Processing event type:', event.type);
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe Webhook] payment_intent.succeeded received:', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });

        // With client-side order creation, we only need to handle payment status updates
        // The order should already be created by the client-side API
        console.log('[Stripe Webhook] Payment succeeded - order should be created client-side');
        
        // Clean up any temporary order data if it exists
        const orderDataKey = paymentIntent.metadata.orderDataKey;
        if (orderDataKey) {
          try {
            await connectToDatabase();
            await TempOrder.deleteOne({ key: orderDataKey });
            console.log('[Stripe Webhook] Cleaned up temporary order data');
          } catch (err) {
            console.log('[Stripe Webhook] No temporary order data to clean up');
          }
        }

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
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
} 