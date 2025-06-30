'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  _id: string;
  reference: string;
  userId: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  createdAt: string;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  };
}

const STATUS_PRIORITY = {
  payment_failed: 1,
  pending: 2,
  paid: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
};

const STATUS_COLORS = {
  payment_failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_ACTIONS: Record<Order['status'], Array<Order['status']>> = {
  payment_failed: ['pending', 'cancelled'],
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: ['pending'],
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('priority');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/admin/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [session]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`;
  };

  const sortOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        return priorityDiff !== 0 ? priorityDiff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const sortedOrders = sortOrders(filteredOrders);

  const getNextActions = (currentStatus: Order['status']): Array<Order['status']> => {
    return STATUS_ACTIONS[currentStatus] || [];
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-semibold text-gray-900">Orders Management</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="priority">Sort by Priority</option>
              <option value="date">Sort by Date</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="all">All Orders</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getNextActions(order.status).length > 0 ? (
                        <div className="flex space-x-2">
                          {getNextActions(order.status).map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() => handleStatusChange(order._id, nextStatus)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                nextStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No actions available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Status Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={getStatusBadgeClass('payment_failed')}>PAYMENT FAILED</span>
                <span className="ml-2 text-sm text-gray-600">Highest priority - needs immediate attention</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('pending')}>PENDING</span>
                <span className="ml-2 text-sm text-gray-600">New orders awaiting processing</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={getStatusBadgeClass('paid')}>PAID</span>
                <span className="ml-2 text-sm text-gray-600">Ready to be shipped</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('shipped')}>SHIPPED</span>
                <span className="ml-2 text-sm text-gray-600">In transit to customer</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={getStatusBadgeClass('delivered')}>DELIVERED</span>
                <span className="ml-2 text-sm text-gray-600">Successfully completed</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('cancelled')}>CANCELLED</span>
                <span className="ml-2 text-sm text-gray-600">Order cancelled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 