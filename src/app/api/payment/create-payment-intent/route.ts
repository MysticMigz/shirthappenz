import { NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import TempOrder from '@/backend/models/TempOrder';

export async function POST(request: Request) {
  if (typeof window !== 'undefined') {
    return NextResponse.json(
      { error: 'This endpoint can only be called from the server' },
      { status: 400 }
    );
  }

  try {
    // Debug request
    console.log('Creating payment intent...');

    const { amount, orderId, items, shippingDetails, visitorId, userId, voucherCode, voucherDiscount, voucherType, voucherValue, voucherId } = await request.json();
    console.log('Payment intent request:', { amount, orderId, items, shippingDetails, visitorId, voucherCode, voucherDiscount, voucherType, voucherValue, voucherId });

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    // Store full order data in database (production-ready)
    const orderDataKey = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await connectToDatabase();
      
      // Store full order data in MongoDB
      const tempOrder = new TempOrder({
        orderDataKey,
        items,
        shippingDetails,
        visitorId,
        userId,
        voucherCode,
        voucherDiscount,
        voucherType,
        voucherValue,
        voucherId,
        amount
      });
      
      await tempOrder.save();
      console.log('[Payment Intent] Temporary order data stored with key:', orderDataKey);
    } catch (error) {
      console.error('[Payment Intent] Failed to store temporary order data:', error);
      // Continue with payment intent creation even if temp storage fails
      // The webhook will fall back to simplified metadata if temp data is not available
    }

    // Create simplified items data for metadata (reduce size to fit Stripe's 500 char limit)
    const simplifiedItems = items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      orderSource: item.orderSource,
      paperSize: item.paperSize,
      // Only include essential customization data, not full URLs
      customization: item.customization ? {
        isCustomized: item.customization.isCustomized,
        designFee: item.customization.designFee,
        hasFrontImage: !!item.customization.frontImage,
        hasBackImage: !!item.customization.backImage,
      } : null
    }));

    // Store simplified order/cart/shipping details in metadata
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount,
      orderId,
      metadata: {
        items: JSON.stringify(simplifiedItems),
        shippingDetails: JSON.stringify(shippingDetails),
        visitorId: visitorId || '',
        userId: userId || '',
        voucherCode: voucherCode || '',
        voucherDiscount: voucherDiscount?.toString() || '',
        voucherType: voucherType || '',
        voucherValue: voucherValue?.toString() || '',
        voucherId: voucherId || '',
        orderDataKey, // Include the key to retrieve full data later
      },
    });

    console.log('Payment intent created:', { paymentIntentId });

    return NextResponse.json({ clientSecret, paymentIntentId });
  } catch (error: any) {
    console.error('Payment intent creation error:', {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 