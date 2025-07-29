import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/backend/models/Voucher';

export async function GET() {
  try {
    await connectToDatabase();

    // Get all vouchers for debugging
    const allVouchers = await Voucher.find({}).select('code description validFrom validUntil isActive usageLimit usedCount type value');

    return NextResponse.json({ 
      total: allVouchers.length,
      vouchers: allVouchers 
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers', details: String(error) },
      { status: 500 }
    );
  }
} 