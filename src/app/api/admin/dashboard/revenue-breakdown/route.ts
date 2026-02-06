import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';

export const dynamic = 'force-dynamic';

type StandardOrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed' | string;
type PaymentStatus = 'completed' | 'pending' | 'unknown' | string;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const mongoose = await connectToDatabase();
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Keep definitions aligned with existing dashboard totals:
    // - Standard orders: exclude cancelled/payment_failed and refunded
    // - Custom orders: revenue includes only paid invoices (paymentStatus = completed) and not cancelled
    const standardOrdersMatch = {
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [{ 'metadata.refundAmount': { $exists: false } }, { 'metadata.refundAmount': { $eq: null } }],
    };

    const now = new Date();
    const last30Start = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));

    const [
      standardTotalsAgg,
      standardByStatusAgg,
      standardLast30Agg,
      standardTopAgg,
    ] = await Promise.all([
      (Order as any).aggregate([
        { $match: standardOrdersMatch },
        { $group: { _id: null, revenue: { $sum: { $ifNull: ['$total', 0] } }, count: { $sum: 1 } } },
      ]),
      (Order as any).aggregate([
        { $match: standardOrdersMatch },
        { $group: { _id: '$status', revenue: { $sum: { $ifNull: ['$total', 0] } }, count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', revenue: 1, count: 1 } },
        { $sort: { revenue: -1 } },
      ]),
      (Order as any).aggregate([
        { $match: { ...standardOrdersMatch, createdAt: { $gte: last30Start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Europe/London' } },
            revenue: { $sum: { $ifNull: ['$total', 0] } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: '$_id', revenue: 1, count: 1 } },
        { $sort: { date: 1 } },
      ]),
      (Order as any).aggregate([
        { $match: standardOrdersMatch },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $project: { _id: 1, reference: 1, createdAt: 1, status: 1, total: 1 } },
      ]),
    ]);

    const standardTotals = standardTotalsAgg?.[0] || { revenue: 0, count: 0 };

    const customOrdersCollection = db.collection('customOrders');
    const invoiceTotalExpr = {
      $convert: { input: '$invoiceData.pricing.total', to: 'double', onError: 0, onNull: 0 },
    };

    const paidCustomMatch = {
      status: { $ne: 'cancelled' },
      paymentStatus: 'completed',
      'invoiceData.pricing.total': { $exists: true },
    };

    const [
      customCounts,
      customPaidTotalsAgg,
      customInvoicedByPaymentStatusAgg,
      customPaidLast30Agg,
      customTopPaidAgg,
    ] = await Promise.all([
      (async () => {
        const [totalNonCancelled, pending, paid] = await Promise.all([
          customOrdersCollection.countDocuments({ status: { $ne: 'cancelled' } }),
          customOrdersCollection.countDocuments({ status: 'pending' }),
          customOrdersCollection.countDocuments({ status: { $ne: 'cancelled' }, paymentStatus: 'completed' }),
        ]);
        return { totalNonCancelled, pending, paid };
      })(),
      customOrdersCollection
        .aggregate([
          { $match: paidCustomMatch },
          { $addFields: { invoiceTotal: invoiceTotalExpr } },
          { $group: { _id: null, revenue: { $sum: '$invoiceTotal' }, count: { $sum: 1 } } },
        ])
        .toArray(),
      customOrdersCollection
        .aggregate([
          { $match: { status: { $ne: 'cancelled' }, 'invoiceData.pricing.total': { $exists: true } } },
          { $addFields: { invoiceTotal: invoiceTotalExpr } },
          {
            $group: {
              _id: { $ifNull: ['$paymentStatus', 'unknown'] },
              invoicedTotal: { $sum: '$invoiceTotal' },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, paymentStatus: '$_id', invoicedTotal: 1, count: 1 } },
          { $sort: { invoicedTotal: -1 } },
        ])
        .toArray(),
      customOrdersCollection
        .aggregate([
          { $match: { ...paidCustomMatch, submittedAt: { $gte: last30Start } } },
          { $addFields: { invoiceTotal: invoiceTotalExpr } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt', timezone: 'Europe/London' } },
              revenue: { $sum: '$invoiceTotal' },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, date: '$_id', revenue: 1, count: 1 } },
          { $sort: { date: 1 } },
        ])
        .toArray(),
      customOrdersCollection
        .aggregate([
          { $match: paidCustomMatch },
          { $addFields: { invoiceTotal: invoiceTotalExpr } },
          { $sort: { invoiceTotal: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              submittedAt: 1,
              invoiceTotal: 1,
            },
          },
        ])
        .toArray(),
    ]);

    const customPaidTotals = customPaidTotalsAgg?.[0] || { revenue: 0, count: 0 };
    const totalRevenue = (Number(standardTotals.revenue) || 0) + (Number(customPaidTotals.revenue) || 0);

    return NextResponse.json({
      totals: {
        totalRevenue,
        standardRevenue: Number(standardTotals.revenue) || 0,
        customPaidRevenue: Number(customPaidTotals.revenue) || 0,
      },
      standard: {
        totalRevenue: Number(standardTotals.revenue) || 0,
        orderCount: Number(standardTotals.count) || 0,
        byStatus: (standardByStatusAgg || []) as Array<{ status: StandardOrderStatus; revenue: number; count: number }>,
        last30Days: (standardLast30Agg || []) as Array<{ date: string; revenue: number; count: number }>,
        topOrders: (standardTopAgg || []).map((o: any) => ({
          id: String(o._id),
          reference: String(o.reference || ''),
          createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
          status: String(o.status || ''),
          total: Number(o.total) || 0,
        })),
      },
      custom: {
        paidRevenue: Number(customPaidTotals.revenue) || 0,
        paidCount: Number(customPaidTotals.count) || 0,
        totalNonCancelledCount: Number(customCounts.totalNonCancelled) || 0,
        pendingCount: Number(customCounts.pending) || 0,
        paidFlagCount: Number(customCounts.paid) || 0,
        invoicedByPaymentStatus: (customInvoicedByPaymentStatusAgg || []) as Array<{
          paymentStatus: PaymentStatus;
          invoicedTotal: number;
          count: number;
        }>,
        last30DaysPaid: (customPaidLast30Agg || []) as Array<{ date: string; revenue: number; count: number }>,
        topPaidOrders: (customTopPaidAgg || []).map((o: any) => ({
          id: String(o._id),
          customerName: `${String(o.firstName || '').trim()} ${String(o.lastName || '').trim()}`.trim() || '—',
          submittedAt: o.submittedAt ? new Date(o.submittedAt).toISOString() : null,
          total: Number(o.invoiceTotal) || 0,
        })),
      },
      meta: {
        last30DaysStart: last30Start.toISOString(),
        timezone: 'Europe/London',
        notes: [
          'Standard revenue matches dashboard: non-cancelled, not payment_failed, and not refunded.',
          'Custom revenue matches dashboard: paid invoices only (paymentStatus = completed) and not cancelled.',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue breakdown' }, { status: 500 });
  }
}

