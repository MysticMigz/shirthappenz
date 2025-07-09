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
  productionStatus: 'not_started' | 'in_production' | 'quality_check' | 'ready_to_ship' | 'completed';
  deliveryPriority: number;
  productionNotes: string;
  productionStartDate: string | null;
  productionCompletedDate: string | null;
  createdAt: string;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
    shippingMethod: string;
  };
}

export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [productionStatusUpdateLoading, setProductionStatusUpdateLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

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
        setOrder(data.order);
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
      setOrder(updatedOrder.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleProductionStatusChange = async (newProductionStatus: string) => {
    setProductionStatusUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionStatus: newProductionStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production status');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production status');
    } finally {
      setProductionStatusUpdateLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionNotes: notesText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production notes');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder.order);
      setEditingNotes(false);
      setNotesText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production notes');
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
                    {order.shippingDetails
                      ? `${order.shippingDetails.firstName ?? ''} ${order.shippingDetails.lastName ?? ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Email:</span>{' '}
                    {order.shippingDetails?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Phone:</span>{' '}
                    {order.shippingDetails?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {order.shippingDetails?.address || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails?.city || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails?.postcode || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Production Information */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Production Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Delivery Priority</h3>
                  <p className={`text-2xl font-bold ${
                    order.deliveryPriority >= 100 ? 'text-red-600' : 
                    order.deliveryPriority >= 50 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {order.deliveryPriority}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.shippingDetails?.shippingMethod || 'N/A'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Production Status</h3>
                  <select
                    value={order.productionStatus}
                    onChange={(e) => handleProductionStatusChange(e.target.value)}
                    disabled={productionStatusUpdateLoading}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_production">In Production</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="ready_to_ship">Ready to Ship</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Production Dates</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    {order.productionStartDate && (
                      <p><strong>Started:</strong> {new Date(order.productionStartDate).toLocaleDateString()}</p>
                    )}
                    {order.productionCompletedDate && (
                      <p><strong>Completed:</strong> {new Date(order.productionCompletedDate).toLocaleDateString()}</p>
                    )}
                    {!order.productionStartDate && !order.productionCompletedDate && (
                      <p>No production dates set</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Production Notes */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Production Notes</h3>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      rows={3}
                      placeholder="Add production notes..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleNotesUpdate}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesText('');
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.productionNotes || 'No production notes added yet.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingNotes(true);
                        setNotesText(order.productionNotes || '');
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      {order.productionNotes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                )}
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
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-4">
                          No items found.
                        </td>
                      </tr>
                    )}
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