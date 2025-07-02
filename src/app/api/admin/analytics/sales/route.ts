import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Order from '@/backend/models/Order';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, year

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Fetch orders within date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: now },
      status: { $in: ['completed', 'delivered'] }
    }).sort({ createdAt: 1 });

    // Process orders for different analytics
    const dailyRevenue: { [key: string]: number } = {};
    const productSales: { [key: string]: number } = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let averageOrderValue = 0;

    orders.forEach(order => {
      // Daily revenue
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;

      // Product sales
      order.items.forEach((item: OrderItem) => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });

      // Total revenue
      totalRevenue += order.total;
    });

    // Calculate average order value
    averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Format daily revenue for chart
    const revenueData = Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Format product sales for chart
    const productData = Object.entries(productSales).map(([name, quantity]) => ({
      name,
      quantity
    })).sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({
      revenueData,
      productData,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
} 