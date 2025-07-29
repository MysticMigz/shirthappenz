'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import RefundModal from '@/app/components/RefundModal';

const formatVoucherDiscount = (order: Order) => {
  if (!order.voucherCode || !order.voucherDiscount) {
    return null;
  }

  const discountAmount = order.voucherDiscount / 100; // Convert from pence to pounds
  const originalTotal = (order.total + order.voucherDiscount) / 100; // Calculate original total

  let discountText = '';
  if (order.voucherType === 'percentage') {
    discountText = `${order.voucherValue}% off`;
  } else if (order.voucherType === 'fixed') {
    discountText = `£${(order.voucherValue || 0) / 100} off`;
  } else if (order.voucherType === 'free_shipping') {
    discountText = 'Free shipping';
  }

  return {
    code: order.voucherCode,
    discountText,
    discountAmount,
    originalTotal,
    finalTotal: order.total / 100,
  };
};

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  customization?: {
    frontImage?: string;
    backImage?: string;
    frontPosition: { x: number; y: number };
    backPosition: { x: number; y: number };
    frontScale: number;
    backScale: number;
    frontRotation?: number;
    backRotation?: number;
    name?: string;
  };
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
  voucherCode?: string;
  voucherDiscount?: number;
  voucherType?: 'percentage' | 'fixed' | 'free_shipping';
  voucherValue?: number;
  metadata?: {
    refundAmount?: number;
    refundReason?: string;
    refundNotes?: string;
    refundedAt?: string;
    refundedBy?: string;
    stripeRefundId?: string;
  };
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
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    orderReference: string;
    orderTotal: number;
  }>({ isOpen: false, orderReference: '', orderTotal: 0 });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState<any>(null);

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

  const fetchRefundInfo = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/refund`);
      if (response.ok) {
        const data = await response.json();
        setRefundInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch refund info:', error);
    }
  };

  const handleRefund = async (refundAmount: number, reason: string, notes: string) => {
    setRefundLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refundAmount, reason, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      const result = await response.json();
      alert(`Refund processed successfully! Refund ID: ${result.refund.id}`);
      setRefundModal({ isOpen: false, orderReference: '', orderTotal: 0 });
      
      // Refresh order details
      const orderResponse = await fetch(`/api/admin/orders/${params.id}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }
    } catch (err) {
      console.error('Refund error:', err);
      alert(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // Fetch refund info when order is cancelled
  useEffect(() => {
    if (order?.status === 'cancelled') {
      fetchRefundInfo();
    }
  }, [order?.status]);

  const exportOrderItemForDTF = (customization: OrderItem['customization'], side = 'front', designName = 'dtf-design') => {
    if (!customization) return;
    const PRINT_WIDTH = 2480; // A4 at 300 DPI
    const PRINT_HEIGHT = 3508;
    const scaleFactor = PRINT_WIDTH / 600; // assuming previewWidth = 600

    const design = customization;
    const imageUrl = side === 'front' ? design.frontImage : design.backImage;
    if (!imageUrl) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PRINT_WIDTH;
      canvas.height = PRINT_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);

      // Use stored customization controls
      const imgPreviewW = 200 * (side === 'front' ? design.frontScale ?? 1 : design.backScale ?? 1);
      const imgPreviewH = 200 * (side === 'front' ? design.frontScale ?? 1 : design.backScale ?? 1);
      const imgPrintW = imgPreviewW * scaleFactor;
      const imgPrintH = imgPreviewH * scaleFactor;
      const offsetX = (side === 'front' ? design.frontPosition?.x ?? 0 : design.backPosition?.x ?? 0) * scaleFactor;
      const offsetY = (side === 'front' ? design.frontPosition?.y ?? 0 : design.backPosition?.y ?? 0) * scaleFactor;
      const rotation = (side === 'front' ? design.frontRotation ?? 0 : design.backRotation ?? 0);

      const centerX = PRINT_WIDTH / 2;
      const centerY = PRINT_HEIGHT / 2;

      ctx.save();
      ctx.translate(centerX + offsetX, centerY + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -imgPrintW / 2, -imgPrintH / 2, imgPrintW, imgPrintH);
      ctx.restore();

      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `${designName}-${side}.png`);
        }
      }, 'image/png');
    };
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
                {order.metadata?.refundAmount && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Refunded £{order.metadata.refundAmount.toFixed(2)}
                  </span>
                )}
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
                          {item.customization && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="mt-2 flex flex-col gap-1">
                                {item.customization?.frontImage && (
                                  <button
                                    className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                    onClick={() => exportOrderItemForDTF(item.customization, 'front', item.customization?.name || item.name)}
                                  >
                                    Export Front for DTF
                                  </button>
                                )}
                                {item.customization?.backImage && (
                                  <button
                                    className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                    onClick={() => exportOrderItemForDTF(item.customization, 'back', item.customization?.name || item.name)}
                                  >
                                    Export Back for DTF
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-4">
                          No items found.
                        </td>
                      </tr>
                    )}
                    {(() => {
                      const voucherInfo = formatVoucherDiscount(order);
                      if (voucherInfo) {
                        return (
                          <>
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                Subtotal
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 line-through">
                                £{voucherInfo.originalTotal.toFixed(2)}
                              </td>
                            </tr>
                            <tr className="bg-purple-50">
                              <td colSpan={5} className="px-6 py-4 text-sm font-medium text-purple-700 text-right">
                                Discount ({voucherInfo.code})
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-700">
                                -£{voucherInfo.discountAmount.toFixed(2)}
                              </td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                Total
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                £{voucherInfo.finalTotal.toFixed(2)}
                              </td>
                            </tr>
                          </>
                        );
                      } else {
                        return (
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                              Total
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              £{order.total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund Section */}
            {order.status === 'cancelled' && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Refund Management</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  {refundInfo ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-md font-semibold text-gray-900">Refund Status</h3>
                          <p className="text-sm text-gray-600">
                            {refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount
                              ? 'Refund has been processed' 
                              : 'Refund not yet processed'}
                          </p>
                        </div>
                        {refundInfo.canRefund && !order.metadata?.refundAmount && (
                          <button
                            onClick={() => setRefundModal({
                              isOpen: true,
                              orderReference: order.reference,
                              orderTotal: order.total
                            })}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                          >
                            Process Refund
                          </button>
                        )}
                        {(refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount) && (
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-green-700">Refunded</span>
                          </div>
                        )}
                      </div>
                      
                      {(refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount) && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-green-800 mb-2">Refund Details</h4>
                          <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Refund ID:</strong> {refundInfo.transaction.refundId || order.metadata?.stripeRefundId || 'N/A'}</p>
                            <p><strong>Amount:</strong> £{(refundInfo.transaction.metadata?.refundAmount || order.metadata?.refundAmount || 0).toFixed(2)}</p>
                            <p><strong>Reason:</strong> {refundInfo.transaction.metadata?.refundReason || order.metadata?.refundReason || 'N/A'}</p>
                            {refundInfo.transaction.metadata?.refundNotes || order.metadata?.refundNotes ? (
                              <p><strong>Notes:</strong> {refundInfo.transaction.metadata?.refundNotes || order.metadata?.refundNotes}</p>
                            ) : null}
                            <p><strong>Processed by:</strong> {refundInfo.transaction.metadata?.refundedBy || order.metadata?.refundedBy || 'N/A'}</p>
                            <p><strong>Date:</strong> {(refundInfo.transaction.metadata?.refundedAt || order.metadata?.refundedAt) ? new Date(refundInfo.transaction.metadata?.refundedAt || order.metadata?.refundedAt || '').toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      )}
                      
                      {refundInfo.transaction.status !== 'refunded' && !order.metadata?.refundAmount && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Refund Information</h4>
                          <div className="text-sm text-yellow-700 space-y-1">
                            <p><strong>Original Payment:</strong> £{refundInfo.transaction.amount.toFixed(2)}</p>
                            <p><strong>Payment Method:</strong> {refundInfo.transaction.paymentMethod}</p>
                            <p><strong>Payment Intent:</strong> {refundInfo.transaction.paymentIntentId}</p>
                            <p><strong>Order Status:</strong> {refundInfo.order.status}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading refund information...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false, orderReference: '', orderTotal: 0 })}
        onRefund={handleRefund}
        orderReference={refundModal.orderReference}
        orderTotal={refundModal.orderTotal}
        loading={refundLoading}
      />
    </div>
  );
} 