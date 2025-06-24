'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
}

interface Order {
  _id: string;
  reference: string;
  userId: string;
  items: OrderItem[];
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

export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrderDetails();
    }
  }, [session, params.id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error || 'Order not found'}</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-purple-600 hover:text-purple-900"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="text-purple-600 hover:text-purple-900"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Order {order.reference}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdateLoading}
                  className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="payment_failed">Payment Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span>{' '}
                    {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Email:</span>{' '}
                    {order.shippingDetails.email}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Phone:</span>{' '}
                    {order.shippingDetails.phone}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {order.shippingDetails.address}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails.city}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails.postcode}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.color || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          £{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          £{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        £{order.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 