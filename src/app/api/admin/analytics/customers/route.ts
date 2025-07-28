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
    const filterType = searchParams.get('filterType');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = searchParams.get('period') || 'month'; // fallback

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

    // Get total customers count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Get new customers in period
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get orders data (excluding cancelled and refunded orders)
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
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
          createdAt: { $gte: startDate, $lte: endDate }
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

    // Unique Visitors (by visitorId in orders)
    const uniqueVisitorsSet = new Set(orders.map(o => o.visitorId).filter(Boolean));
    const uniqueVisitors = uniqueVisitorsSet.size;

    // Visitor-to-Registered Conversion (visitorIds that became users)
    const usersWithVisitorId = await User.find({ visitorId: { $in: Array.from(uniqueVisitorsSet) } }, 'visitorId');
    const convertedVisitors = new Set(usersWithVisitorId.map(u => u.visitorId).filter(Boolean));
    const visitorToRegistered = convertedVisitors.size;

    // Guest Orders vs. Registered Orders
    let guestOrders = 0, registeredOrders = 0;
    orders.forEach(order => {
      if (order.userId && order.userId.includes('@')) registeredOrders++;
      else if (order.visitorId) guestOrders++;
    });

    // LTV Distribution (histogram)
    const ltvBuckets: Record<string, number> = { '0-50': 0, '51-200': 0, '201-500': 0, '501+': 0 };
    customerSpending.forEach(total => {
      if (total <= 50) ltvBuckets['0-50']++;
      else if (total <= 200) ltvBuckets['51-200']++;
      else if (total <= 500) ltvBuckets['201-500']++;
      else ltvBuckets['501+']++;
    });

    // Orders per Customer Distribution
    const ordersPerCustomerBuckets: Record<string, number> = { '1': 0, '2': 0, '3-5': 0, '6+': 0 };
    customerOrders.forEach(count => {
      if (count === 1) ordersPerCustomerBuckets['1']++;
      else if (count === 2) ordersPerCustomerBuckets['2']++;
      else if (count >= 3 && count <= 5) ordersPerCustomerBuckets['3-5']++;
      else if (count >= 6) ordersPerCustomerBuckets['6+']++;
    });

    // Top 5 Customers by Revenue
    const topCustomers = Array.from(customerSpending.entries())
      .filter(([userId]) => userId && userId.includes('@'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, total]) => ({ userId, total }));

    // Geographic Distribution (by city/county from orders)
    const geoCounts: Record<string, number> = {};
    orders.forEach(order => {
      const city = order.shippingDetails?.city || 'Unknown';
      geoCounts[city] = (geoCounts[city] || 0) + 1;
    });

    // Average Order Value Over Time (by day)
    const aovByDay: Record<string, { total: number; count: number }> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!aovByDay[date]) aovByDay[date] = { total: 0, count: 0 };
      aovByDay[date].total += order.total;
      aovByDay[date].count++;
    });
    const aovTrend = Object.entries(aovByDay).map(([date, value]) => ({ date, aov: value.count ? value.total / value.count : 0 }));

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
      })),
      uniqueVisitors,
      visitorToRegistered,
      guestOrders,
      registeredOrders,
      ltvBuckets,
      ordersPerCustomerBuckets,
      topCustomers,
      geoCounts,
      aovTrend
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
} 