import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse date range
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const query: any = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }
    // Only include paid/delivered orders (excluding refunded orders)
    query.status = { $in: ['paid', 'delivered'] };
    query.$or = [
      { 'metadata.refundAmount': { $exists: false } },
      { 'metadata.refundAmount': { $exists: true, $eq: null } }
    ];

    const orders = await Order.find(query);
    let totalNet = 0, totalVAT = 0, totalGross = 0;
    const orderList = orders.map(order => {
      const net = order.total - order.vat;
      const vat = order.vat;
      const gross = order.total;
      totalNet += net;
      totalVAT += vat;
      totalGross += gross;
      return {
        reference: order.reference,
        createdAt: order.createdAt,
        net,
        vat,
        gross
      };
    });
    return NextResponse.json({
      totalNet,
      totalVAT,
      totalGross,
      orders: orderList
    });
  } catch (error) {
    console.error('Error generating tax report:', error);
    return NextResponse.json(
      { error: 'Failed to generate tax report' },
      { status: 500 }
    );
  }
} 