import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

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
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get total orders and revenue (excluding cancelled and refunded orders)
    const totalOrders = await Order.countDocuments({
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
    });
    
    const orders = await Order.find({
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Get pending orders
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Get low stock products (less than 10 items)
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
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