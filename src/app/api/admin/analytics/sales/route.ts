import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Order from '@/backend/models/Order';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filterType');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = searchParams.get('period') || 'week'; // fallback

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let endDate = now;
    if (startDateParam && endDateParam) {
      // Use custom date range from query
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Set endDate to end of day
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Fetch orders within date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['paid', 'shipped', 'completed', 'delivered'] }
    }).sort({ createdAt: 1 });

    // Process orders for different analytics
    const dailyRevenue: { [key: string]: number } = {};
    const productSales: { [key: string]: number } = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let averageOrderValue = 0;

    // --- Sales by Category ---
    const categorySales: { [key: string]: { quantity: number; revenue: number } } = {};
    const productIdToCategory: { [key: string]: string } = {};

    for (const order of orders) {
      // Daily revenue
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;

      // Product sales & category sales
      for (const item of order.items) {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;

        // Look up category (cache by productId)
        let category = productIdToCategory[item.productId];
        if (!category) {
          const product = await Product.findById(item.productId).select('category');
          category = product?.category || 'Unknown';
          productIdToCategory[item.productId] = category;
        }
        if (!categorySales[category]) {
          categorySales[category] = { quantity: 0, revenue: 0 };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].revenue += item.price * item.quantity;
      }

      // Total revenue
      totalRevenue += order.total;
    }

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

    // Format category sales for chart
    const categoryData = Object.entries(categorySales).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue);

    // --- Repeat vs. New Customers ---
    // 1. Find all unique userIds in this period
    const userIdsInPeriod = Array.from(new Set(orders.map(order => order.userId)));
    // 2. Find which of these had an order before the period
    const previousOrders = await Order.find({
      userId: { $in: userIdsInPeriod },
      createdAt: { $lt: startDate },
      status: { $in: ['paid', 'shipped', 'completed', 'delivered'] }
    }).select('userId');
    const repeatUserIds = new Set(previousOrders.map(o => o.userId));
    // 3. Aggregate order count and revenue for new vs repeat
    let newCustomerOrders = 0, repeatCustomerOrders = 0;
    let newCustomerRevenue = 0, repeatCustomerRevenue = 0;
    orders.forEach(order => {
      if (repeatUserIds.has(order.userId)) {
        repeatCustomerOrders++;
        repeatCustomerRevenue += order.total;
      } else {
        newCustomerOrders++;
        newCustomerRevenue += order.total;
      }
    });
    const repeatVsNewData = {
      new: { orders: newCustomerOrders, revenue: newCustomerRevenue },
      repeat: { orders: repeatCustomerOrders, revenue: repeatCustomerRevenue }
    };

    return NextResponse.json({
      revenueData,
      productData,
      categoryData,
      repeatVsNewData,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue
      }
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
} 