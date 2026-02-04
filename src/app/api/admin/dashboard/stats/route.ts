import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

// Force dynamic rendering - this route uses getServerSession() which accesses headers
// This prevents Next.js from trying to statically generate this route during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database and verify admin status
    const mongoose = await connectToDatabase();
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const db = mongoose.connection.db;

    // Standard orders: total + revenue (excluding cancelled/payment_failed and refunded)
    const standardOrdersQuery = {
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
    };
    const totalStandardOrders = await (Order as any).countDocuments(standardOrdersQuery);
    
    const orders = await (Order as any).find(standardOrdersQuery).lean();
    
    const standardRevenue = orders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0);

    // Get pending orders
    const pendingStandardOrders = await (Order as any).countDocuments({ status: 'pending' });

    // Get low stock products (less than 10 items)
    const lowStockProducts = await (Product as any).countDocuments({ stock: { $lt: 10 } });

    // Custom orders: count + revenue + pending
    let totalCustomOrders = 0;
    let pendingCustomOrders = 0;
    let customRevenue = 0;
    if (db) {
      const customOrdersCollection = db.collection('customOrders');

      totalCustomOrders = await customOrdersCollection.countDocuments({
        status: { $ne: 'cancelled' },
      });

      pendingCustomOrders = await customOrdersCollection.countDocuments({
        status: 'pending',
      });

      const paidCustomOrders = await customOrdersCollection
        .find(
          { paymentStatus: 'completed', status: { $ne: 'cancelled' } },
          { projection: { invoiceData: 1 } }
        )
        .toArray();

      customRevenue = paidCustomOrders.reduce((sum: number, co: any) => {
        const total = Number(co?.invoiceData?.pricing?.total);
        return sum + (Number.isFinite(total) ? total : 0);
      }, 0);
    }

    return NextResponse.json({
      totalOrders: totalStandardOrders + totalCustomOrders,
      totalRevenue: standardRevenue + customRevenue,
      pendingOrders: pendingStandardOrders + pendingCustomOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 