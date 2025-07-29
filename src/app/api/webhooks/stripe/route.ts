import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  console.log('[Stripe Webhook] Handler triggered');
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Read the raw body as a buffer
  const rawBody = await req.arrayBuffer();
  const buf = Buffer.from(rawBody);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Stripe Webhook] payment_intent.succeeded received:', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });
        
        // Check if this is a test webhook without proper metadata
        if (!paymentIntent.metadata?.items || !paymentIntent.metadata?.shippingDetails) {
          console.log('[Stripe Webhook] Test webhook detected - skipping order creation');
          return NextResponse.json({ received: true });
        }
        
        // Extract order/cart/shipping details from metadata
        let items, shippingDetails;
        try {
          items = paymentIntent.metadata?.items ? JSON.parse(paymentIntent.metadata.items) : [];
          shippingDetails = paymentIntent.metadata?.shippingDetails ? JSON.parse(paymentIntent.metadata.shippingDetails) : {};
        } catch (error) {
          console.error('[Stripe Webhook] Error parsing metadata:', error);
          return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 });
        }
        
        const visitorId = paymentIntent.metadata?.visitorId || '';
        const total = paymentIntent.amount / 100;

        // Only create the order if payment is successful
        await connectToDatabase();
        console.log('[Stripe Webhook] Connected to database');
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

        // Extract voucher information from metadata
        const voucherCode = paymentIntent.metadata?.voucherCode || null;
        const voucherDiscount = voucherCode ? parseFloat(paymentIntent.metadata?.voucherDiscount || '0') : 0;
        const voucherType = paymentIntent.metadata?.voucherType || null;
        const voucherValue = voucherCode ? parseFloat(paymentIntent.metadata?.voucherValue || '0') : null;

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
          voucherCode,
          voucherDiscount,
          voucherType,
          voucherValue,
        });
        try {
          await order.save();
          console.log('[Stripe Webhook] Order saved:', order._id, order.reference);
        } catch (err) {
          console.error('[Stripe Webhook] Error saving order:', err);
          throw err;
        }

        // Create transaction record
        const transactionData: any = {
          orderId: order._id,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: 'stripe',
          status: 'completed',
          paymentIntentId: paymentIntent.id,
        };
        // Only set userId if it looks like a valid ObjectId
        if (
          order.userId &&
          typeof order.userId === 'string' &&
          /^[a-fA-F0-9]{24}$/.test(order.userId)
        ) {
          transactionData.userId = order.userId;
        }
        const transaction = new Transaction(transactionData);
        try {
          await transaction.save();
          console.log('[Stripe Webhook] Transaction saved:', transaction._id);
        } catch (err) {
          console.error('[Stripe Webhook] Error saving transaction:', err);
          throw err;
        }

        // Send order confirmation email
        try {
          console.log('[Stripe Webhook] Preparing to send order confirmation email');
          console.log('[Stripe Webhook] Sending order confirmation email to:', order.shippingDetails?.email);
          await sendOrderConfirmationEmail(
            order.reference,
            order.items,
            order.shippingDetails,
            order.total,
            order.vat,
            order.createdAt,
            order.status
          );
          console.log('[Stripe Webhook] Order confirmation email sent successfully');
        } catch (err) {
          console.error('[Stripe Webhook] Error sending order confirmation email:', err);
        }
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
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
} 