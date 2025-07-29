import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import Voucher from '@/backend/models/Voucher';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { code, orderTotal, items } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    if (!orderTotal || orderTotal <= 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      );
    }

    // Find the voucher by code
    const voucher = await Voucher.findOne({ 
      code: code.toUpperCase().trim(),
      isActive: true 
    });

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid voucher code' },
        { status: 404 }
      );
    }

    // Check if voucher is valid
    if (!voucher.isValid()) {
      return NextResponse.json(
        { error: 'Voucher is not valid or has expired' },
        { status: 400 }
      );
    }

    // Check if voucher can be applied to this order
    if (!voucher.canApplyToOrder(orderTotal, items || [])) {
      if (voucher.minimumOrderAmount && orderTotal < voucher.minimumOrderAmount) {
        return NextResponse.json(
          { error: `Minimum order amount of £${(voucher.minimumOrderAmount / 100).toFixed(2)} required` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Voucher cannot be applied to this order' },
        { status: 400 }
      );
    }

    // Calculate discount
    const discountAmount = voucher.calculateDiscount(orderTotal);
    const newTotal = orderTotal - discountAmount;

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        description: voucher.description,
        discountAmount,
        newTotal
      }
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to validate voucher' },
      { status: 500 }
    );
  }
} 