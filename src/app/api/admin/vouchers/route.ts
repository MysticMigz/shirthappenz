import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Voucher from '@/backend/models/Voucher';
import User from '@/backend/models/User';

// Helper function to check admin status
async function verifyAdmin(email: string) {
  const user = await User.findOne({ email });
  if (!user?.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    await verifyAdmin(session.user.email);

    // Get all vouchers, sorted by creation date
    const vouchers = await Voucher.find().sort({ createdAt: -1 });

    return NextResponse.json({ vouchers });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    await verifyAdmin(session.user.email);

    const voucherData = await request.json();

    // Validate required fields
    if (!voucherData.code) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    if (!voucherData.type || !['percentage', 'fixed', 'free_shipping'].includes(voucherData.type)) {
      return NextResponse.json({ error: 'Valid voucher type is required' }, { status: 400 });
    }

    if (voucherData.type !== 'free_shipping' && (!voucherData.value || voucherData.value <= 0)) {
      return NextResponse.json({ error: 'Valid voucher value is required' }, { status: 400 });
    }

    if (!voucherData.usageLimit || voucherData.usageLimit <= 0) {
      return NextResponse.json({ error: 'Valid usage limit is required' }, { status: 400 });
    }

    if (!voucherData.validFrom || !voucherData.validUntil) {
      return NextResponse.json({ error: 'Valid from and until dates are required' }, { status: 400 });
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ code: voucherData.code.toUpperCase() });
    if (existingVoucher) {
      return NextResponse.json({ error: 'Voucher code already exists' }, { status: 400 });
    }

    // Create new voucher
    const voucher = new Voucher({
      ...voucherData,
      code: voucherData.code.toUpperCase(),
      usedCount: 0,
    });

    await voucher.save();

    return NextResponse.json({ 
      success: true, 
      voucher,
      message: 'Voucher created successfully' 
    });

  } catch (error) {
    console.error('Error creating voucher:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
} 