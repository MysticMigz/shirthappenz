import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/backend/models/Voucher';

export async function GET() {
  try {
    await connectToDatabase();

    // Get all active vouchers that are currently valid
    const now = new Date();
    console.log('Fetching active vouchers at:', now.toISOString());
    
    const activeVouchers = await Voucher.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).select('code description validUntil type value minimumOrderAmount usageLimit usedCount');
    
    console.log('Found active vouchers:', activeVouchers.length);

    // Transform the data for the frontend and filter out vouchers that have reached their usage limit
    const discountCodes = activeVouchers
      .filter(voucher => {
        // If usageLimit is 0, it means unlimited usage
        if (voucher.usageLimit === 0) return true;
        // Otherwise, check if usedCount is less than usageLimit
        return voucher.usedCount < voucher.usageLimit;
      })
      .map(voucher => ({
        code: voucher.code,
        description: voucher.description || `${voucher.type === 'percentage' ? voucher.value + '%' : '£' + (voucher.value / 100).toFixed(2)} off`,
        validUntil: voucher.validUntil.toISOString().split('T')[0],
        type: voucher.type,
        value: voucher.value,
        minimumOrderAmount: voucher.minimumOrderAmount
      }));
    
    console.log('Final discount codes:', discountCodes.length);

    return NextResponse.json({ discountCodes });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
} 