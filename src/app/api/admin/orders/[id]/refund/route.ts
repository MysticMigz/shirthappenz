import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import User from '@/backend/models/User';
import Stripe from 'stripe';
import { sendRefundConfirmationEmail } from '@/lib/email';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get user from database and verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const { refundAmount, reason, notes } = await request.json();

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is cancelled
    if (order.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Order must be cancelled before refund can be processed' },
        { status: 400 }
      );
    }

    // Find the transaction
    const transaction = await Transaction.findOne({ orderId: order._id });
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found for this order. Cannot process refund without transaction record.' },
        { status: 404 }
      );
    }

    // Check if already refunded
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Order has already been refunded' },
        { status: 400 }
      );
    }

    // Check if there are existing refunds in Stripe
    try {
      const existingRefunds = await stripe.refunds.list({
        payment_intent: transaction.paymentIntentId,
      });
      
      if (existingRefunds.data.length > 0) {
        console.log('Found existing refunds:', existingRefunds.data.length);
        // Update transaction status to reflect the existing refund
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: 'refunded',
          refundId: existingRefunds.data[0].id,
        });
        
        return NextResponse.json(
          { error: 'Order has already been refunded in Stripe' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing refunds:', error);
      // Continue with the refund process
    }

    // Validate refund amount
    const maxRefundAmount = transaction.amount;
    const actualRefundAmount = refundAmount || maxRefundAmount;
    
    if (actualRefundAmount > maxRefundAmount) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed original payment amount of £${maxRefundAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (actualRefundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    let refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: transaction.paymentIntentId,
        amount: Math.round(actualRefundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          orderId: order._id.toString(),
          orderReference: order.reference,
          refundReason: reason || 'Order cancellation',
          refundNotes: notes || '',
          refundedBy: user.email,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      
      // Check if the error is because the charge is already refunded
      if (stripeError.code === 'charge_already_refunded') {
        // Get existing refunds for this payment intent
        const existingRefunds = await stripe.refunds.list({
          payment_intent: transaction.paymentIntentId,
        });
        
        if (existingRefunds.data.length > 0) {
          // Use the existing refund
          refund = existingRefunds.data[0];
          console.log('Using existing refund:', refund.id);
        } else {
          return NextResponse.json(
            { error: 'Charge has already been refunded but no refund record found' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Failed to process refund: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    // Update transaction status
    const updatedMetadata = {
      ...(transaction.metadata?.toObject ? transaction.metadata.toObject() : transaction.metadata || {}),
      refundAmount: actualRefundAmount,
      refundReason: reason || 'Order cancellation',
      refundNotes: notes || '',
      refundedAt: new Date().toISOString(),
      refundedBy: user.email,
    };

    await Transaction.findByIdAndUpdate(transaction._id, {
      status: 'refunded',
      refundId: refund.id,
      metadata: updatedMetadata,
    });

    // Update order with refund information
    const orderMetadata = {
      ...(order.metadata?.toObject ? order.metadata.toObject() : order.metadata || {}),
      refundAmount: actualRefundAmount,
      refundReason: reason || 'Order cancellation',
      refundNotes: notes || '',
      refundedAt: new Date().toISOString(),
      refundedBy: user.email,
      stripeRefundId: refund.id,
    };

    await Order.findByIdAndUpdate(order._id, {
      metadata: orderMetadata,
    });

    // Send refund confirmation email
    try {
      await sendRefundConfirmationEmail(
        order.reference,
        order.shippingDetails,
        order.items,
        actualRefundAmount,
        reason || 'Order cancellation',
        notes
      );
    } catch (error) {
      console.error('Failed to send refund confirmation email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: actualRefundAmount,
        status: refund.status,
        reason: reason || 'Order cancellation',
      },
      order: {
        id: order._id,
        reference: order.reference,
        refundAmount: actualRefundAmount,
      },
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

// Get refund information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('GET /api/admin/orders/[id]/refund called with params:', params);
  
  // Simple test response first
  if (params.id === 'test') {
    return NextResponse.json({ message: 'Refund route is working', params });
  }
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get user from database and verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    console.log('Looking for order with ID:', id);

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      console.log('Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order found:', order.reference);

    // Find the transaction
    const transaction = await Transaction.findOne({ orderId: order._id });
    if (!transaction) {
      console.log('Transaction not found - creating placeholder transaction');
      // Create a placeholder transaction for orders without transaction records
      const placeholderTransaction = {
        _id: new mongoose.Types.ObjectId(),
        orderId: order._id,
        amount: order.total,
        currency: 'GBP',
        paymentMethod: 'stripe',
        status: 'completed', // Assume payment was completed if order exists
        paymentIntentId: 'placeholder_' + order._id.toString(),
        metadata: {
          createdFromOrder: true,
          orderReference: order.reference,
        }
      };
      
      return NextResponse.json({
        order: {
          id: order._id,
          reference: order.reference,
          status: order.status,
          total: order.total,
          cancellationRequested: order.cancellationRequested,
          cancellationReason: order.cancellationReason,
          cancellationRequestedAt: order.cancellationRequestedAt,
        },
        transaction: placeholderTransaction,
        canRefund: order.status === 'cancelled' && placeholderTransaction.status !== 'refunded',
        maxRefundAmount: order.total,
        note: 'No original transaction found - using order total as refund amount'
      });
    }

    console.log('Transaction found, status:', transaction.status);

    return NextResponse.json({
      order: {
        id: order._id,
        reference: order.reference,
        status: order.status,
        total: order.total,
        cancellationRequested: order.cancellationRequested,
        cancellationReason: order.cancellationReason,
        cancellationRequestedAt: order.cancellationRequestedAt,
      },
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        paymentIntentId: transaction.paymentIntentId,
        refundId: transaction.refundId,
        metadata: transaction.metadata,
      },
      canRefund: order.status === 'cancelled' && transaction.status !== 'refunded',
      maxRefundAmount: transaction.amount,
    });

  } catch (error) {
    console.error('Get refund info error:', error);
    return NextResponse.json(
      { error: 'Failed to get refund information' },
      { status: 500 }
    );
  }
} 