import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const {
      paymentIntentId,
      items,
      shippingDetails,
      total,
      vat,
      voucherCode,
      voucherDiscount,
      voucherType,
      voucherValue,
      voucherId,
      visitorId,
      userId
    } = await req.json();

    // Generate order reference
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    
    const orderCount = await Order.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    });
    
    const reference = `SH-${dateStr}-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create the order
    const order = new Order({
      userId: userId || visitorId || 'guest',
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
      voucherId,
    });

    await order.save();
    console.log('[Create Order API] Order saved:', order._id, order.reference);

    // Create transaction record
    const transactionData: any = {
      orderId: order._id,
      amount: total,
      currency: 'GBP',
      paymentMethod: 'stripe',
      status: 'completed',
      paymentIntentId,
    };
    
    if (userId && typeof userId === 'string' && /^[a-fA-F0-9]{24}$/.test(userId)) {
      transactionData.userId = userId;
    }
    
    const transaction = new Transaction(transactionData);
    await transaction.save();
    console.log('[Create Order API] Transaction saved:', transaction._id);

    // Send order confirmation email
    try {
      console.log('[Create Order API] Sending order confirmation email to:', order.shippingDetails?.email);
      await sendOrderConfirmationEmail(
        order.reference,
        order.items,
        order.shippingDetails,
        order.total,
        order.vat,
        order.createdAt,
        order.status,
        order.voucherCode,
        order.voucherDiscount,
        order.voucherType,
        order.voucherValue
      );
      console.log('[Create Order API] Order confirmation email sent successfully');
    } catch (err) {
      console.error('[Create Order API] Error sending order confirmation email:', err);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order._id,
      reference: order.reference 
    });

  } catch (error) {
    console.error('[Create Order API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 