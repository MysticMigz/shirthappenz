'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RevenueBreakdownResponse {
  totals: {
    totalRevenue: number;
    standardRevenue: number;
    customPaidRevenue: number;
  };
  standard: {
    totalRevenue: number;
    orderCount: number;
    byStatus: Array<{ status: string; revenue: number; count: number }>;
    last30Days: Array<{ date: string; revenue: number; count: number }>;
    topOrders: Array<{ id: string; reference: string; createdAt: string | null; status: string; total: number }>;
  };
  custom: {
    paidRevenue: number;
    paidCount: number;
    totalNonCancelledCount: number;
    pendingCount: number;
    paidFlagCount: number;
    invoicedByPaymentStatus: Array<{ paymentStatus: string; invoicedTotal: number; count: number }>;
    last30DaysPaid: Array<{ date: string; revenue: number; count: number }>;
    topPaidOrders: Array<{ id: string; customerName: string; submittedAt: string | null; total: number }>;
  };
  meta?: {
    last30DaysStart?: string;
    timezone?: string;
    notes?: string[];
  };
}

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [loading, setLoading] = useState(true);

  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownResponse | null>(null);
  const [revenueBreakdownLoading, setRevenueBreakdownLoading] = useState(false);
  const [revenueBreakdownError, setRevenueBreakdownError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 [AdminDashboard] Component mounted');
    console.log('🔍 [AdminDashboard] Session status:', status);
    console.log('🔍 [AdminDashboard] Session data:', session);
    
    // Only redirect if we're definitely unauthenticated (not loading)
    // The server-side layout already handles authentication, so we can be less strict here
    // This prevents redirect loops if the client-side session hasn't loaded yet
    if (status === 'unauthenticated') {
      console.log('❌ [AdminDashboard] Unauthenticated - redirecting to login');
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      console.log('✅ [AdminDashboard] Authenticated');
      console.log('🔍 [AdminDashboard] User isAdmin:', session?.user?.isAdmin);
      if (!session?.user?.isAdmin) {
        console.error('❌ [AdminDashboard] User is not admin!');
        // Don't redirect here - let the server-side layout handle it
      }
    } else if (status === 'loading') {
      console.log('⏳ [AdminDashboard] Session loading...');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardStats();
    }
  }, [session]);

  const openRevenueBreakdown = async () => {
    setShowRevenueBreakdown(true);
    if (revenueBreakdown || revenueBreakdownLoading) return;

    setRevenueBreakdownLoading(true);
    setRevenueBreakdownError(null);
    try {
      const res = await fetch('/api/admin/dashboard/revenue-breakdown');
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load revenue breakdown');
      }
      setRevenueBreakdown(json as RevenueBreakdownResponse);
    } catch (e) {
      setRevenueBreakdownError(e instanceof Error ? e.message : 'Failed to load revenue breakdown');
    } finally {
      setRevenueBreakdownLoading(false);
    }
  };

  // Don't show loading spinner if session is still loading
  // The server-side layout already handles authentication
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalOrders}</p>
          </div>
          <button
            type="button"
            onClick={openRevenueBreakdown}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg hover:bg-gray-50 transition-shadow focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pointer-events-auto relative"
            aria-label="View total revenue breakdown"
            title="Click to view revenue breakdown"
          >
            <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">£{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Click to view breakdown</p>
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Pending Orders</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Low Stock Products</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockProducts}</p>
          </div>
        </div>

        {showRevenueBreakdown && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Revenue breakdown"
            onClick={() => setShowRevenueBreakdown(false)}
          >
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-200">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">Revenue breakdown</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Last 30 days view + all-time totals. (Uses the same rules as the dashboard.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevenueBreakdown(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close revenue breakdown"
                >
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {revenueBreakdownLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                  </div>
                )}

                {!revenueBreakdownLoading && revenueBreakdownError && (
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                    {revenueBreakdownError}
                  </div>
                )}

                {!revenueBreakdownLoading && revenueBreakdown && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Total revenue</div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {gbp.format(revenueBreakdown.totals.totalRevenue)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Standard orders</div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {gbp.format(revenueBreakdown.totals.standardRevenue)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {revenueBreakdown.standard.orderCount} orders
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Custom orders (paid)</div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {gbp.format(revenueBreakdown.totals.customPaidRevenue)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {revenueBreakdown.custom.paidCount} paid invoices
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="font-medium text-gray-900">Standard revenue by status</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Non-cancelled, not payment_failed, not refunded (matches dashboard)
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {revenueBreakdown.standard.byStatus.map((row) => (
                                <tr key={row.status}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{row.status}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{row.count}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{gbp.format(row.revenue)}</td>
                                </tr>
                              ))}
                              {revenueBreakdown.standard.byStatus.length === 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="font-medium text-gray-900">Custom orders (invoiced) by payment status</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Breakdown uses invoice totals; dashboard revenue counts only “completed”
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Invoiced total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {revenueBreakdown.custom.invoicedByPaymentStatus.map((row) => (
                                <tr key={row.paymentStatus}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{row.paymentStatus || 'unknown'}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{row.count}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{gbp.format(row.invoicedTotal)}</td>
                                </tr>
                              ))}
                              {revenueBreakdown.custom.invoicedByPaymentStatus.length === 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                                    No invoiced custom orders found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="font-medium text-gray-900">Top standard orders</div>
                          <div className="text-xs text-gray-500 mt-1">Highest totals (all time)</div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {revenueBreakdown.standard.topOrders.map((o) => (
                                <tr key={o.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{o.reference || o.id}</td>
                                  <td className="px-4 py-2 text-sm text-gray-700">{o.status}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{gbp.format(o.total)}</td>
                                </tr>
                              ))}
                              {revenueBreakdown.standard.topOrders.length === 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="font-medium text-gray-900">Top paid custom orders</div>
                          <div className="text-xs text-gray-500 mt-1">Highest paid invoice totals (all time)</div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {revenueBreakdown.custom.topPaidOrders.map((o) => (
                                <tr key={o.id}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{o.customerName}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{gbp.format(o.total)}</td>
                                </tr>
                              ))}
                              {revenueBreakdown.custom.topPaidOrders.length === 0 && (
                                <tr>
                                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={2}>
                                    No paid custom orders found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {revenueBreakdown.meta?.notes?.length ? (
                      <div className="text-xs text-gray-500">
                        {revenueBreakdown.meta.notes.map((n, idx) => (
                          <div key={idx}>{n}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-purple-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-semibold">Manage Orders</h3>
            </div>
            <p className="text-gray-600">View and manage all orders</p>
          </Link>

          <Link
            href="/admin/custom-orders"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-purple-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657-1.79-3-4-3S4 9.343 4 11s1.79 3 4 3 4-1.343 4-3zm0 0c0 1.657 1.79 3 4 3s4-1.343 4-3-1.79-3-4-3-4 1.343-4 3zM4 20v-1a5 5 0 015-5h0M20 20v-1a5 5 0 00-5-5h0" />
              </svg>
              <h3 className="text-lg font-semibold">Manage Custom Orders</h3>
            </div>
            <p className="text-gray-600">View and manage custom order invoices</p>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-blue-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-lg font-semibold">Manage Products</h3>
            </div>
            <p className="text-gray-600">Add and edit products</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-green-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-semibold">Manage Users</h3>
            </div>
            <p className="text-gray-600">View and manage users</p>
          </Link>

          <Link
            href="/admin/stock"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-yellow-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold">Stock Management</h3>
            </div>
            <p className="text-gray-600">Manage product inventory</p>
          </Link>

          <Link
            href="/admin/alerts"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-red-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold">Stock Alerts</h3>
            </div>
            <p className="text-gray-600">View low stock alerts</p>
          </Link>

          <Link
            href="/admin/supplies"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center text-indigo-600 mb-4">
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-semibold">Manage Supplies</h3>
            </div>
            <p className="text-gray-600">Order and manage supplies</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 