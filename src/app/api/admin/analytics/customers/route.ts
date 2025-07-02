import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';

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
    const period = searchParams.get('period') || 'month'; // week, month, year

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

    // Get total customers count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Get new customers in period
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate, $lte: now }
    });

    // Get orders data
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: now }
    });

    // Calculate customer metrics
    const customerOrders = new Map<string, number>();
    const customerSpending = new Map<string, number>();
    let totalOrders = orders.length;
    let totalRevenue = 0;

    orders.forEach(order => {
      const userId = order.userId;
      customerOrders.set(userId, (customerOrders.get(userId) || 0) + 1);
      customerSpending.set(userId, (customerSpending.get(userId) || 0) + order.total);
      totalRevenue += order.total;
    });

    // Calculate average order value and frequency
    const uniqueCustomers = customerOrders.size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageOrdersPerCustomer = uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0;

    // Get repeat customer rate
    const repeatCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length;
    const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    // Get customer spending tiers
    const spendingTiers = {
      low: 0,    // £0-50
      medium: 0, // £51-200
      high: 0    // £200+
    };

    customerSpending.forEach(total => {
      if (total <= 50) spendingTiers.low++;
      else if (total <= 200) spendingTiers.medium++;
      else spendingTiers.high++;
    });

    // Get daily new customers for trend
    const dailyNewCustomers = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return NextResponse.json({
      summary: {
        totalCustomers,
        newCustomers,
        uniqueCustomers,
        repeatCustomers,
        repeatRate,
        averageOrderValue,
        averageOrdersPerCustomer
      },
      spendingTiers,
      dailyNewCustomers: dailyNewCustomers.map(day => ({
        date: day._id,
        count: day.count
      }))
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
} 