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
        // Extract order/cart/shipping details from metadata
        const items = paymentIntent.metadata?.items ? JSON.parse(paymentIntent.metadata.items) : [];
        const shippingDetails = paymentIntent.metadata?.shippingDetails ? JSON.parse(paymentIntent.metadata.shippingDetails) : {};
        const visitorId = paymentIntent.metadata?.visitorId || '';
        const total = paymentIntent.amount / 100;

        // Only create the order if payment is successful
        await connectToDatabase();
        // Generate reference number (reuse logic from /api/orders if needed)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        const todayCount = await Order.countDocuments({
          createdAt: { $gte: startOfDay, $lt: endOfDay }
        });
        const sequence = (todayCount + 1).toString().padStart(4, '0');
        const reference = `SH-${year}${month}${day}-${sequence}`;

        // Calculate VAT (UK VAT 20%)
        const vatBase = total + (shippingDetails.shippingCost || 0);
        const vat = Number((vatBase / 1.2 * 0.2).toFixed(2));

        // Create the order
        const order = new Order({
          userId: paymentIntent.metadata?.userId || visitorId || 'guest',
          reference,
          items,
          shippingDetails,
          total,
          vat,
          status: 'paid',
          orderSource: items?.[0]?.orderSource || undefined,
          visitorId,
        });
        await order.save();

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

        // Send order confirmation email
        await sendOrderConfirmationEmail(
          order.reference,
          order.items,
          order.shippingDetails,
          order.total,
          order.vat,
          order.createdAt,
          order.status
        );
        // Do NOT send payment confirmation email anymore

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