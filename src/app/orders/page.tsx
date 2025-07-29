'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import CancellationModal from '@/app/components/CancellationModal';
import { getImageUrl } from '@/lib/utils';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
  customization?: {
    name: string;
    number: string;
    isCustomized: boolean;
    nameCharacters: number;
    numberCharacters: number;
    customizationCost: number;
  };
}

interface Order {
  _id: string;
  reference: string;
  items: OrderItem[];
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    addressLine2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    shippingCost: number;
    shippingMethod: string;
  };
  total: number;
  vat: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  productionStatus: 'not_started' | 'in_production' | 'quality_check' | 'ready_to_ship' | 'completed';
  cancellationRequested: boolean;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationRequestedBy?: 'customer' | 'admin';
  cancellationNotes?: string;
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
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  payment_failed: 'bg-red-100 text-red-800',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderReference: string;
  }>({ isOpen: false, orderId: '', orderReference: '' });
  const [cancellationLoading, setCancellationLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const handleCancellationRequest = async (reason: string, notes: string) => {
    setCancellationLoading(true);
    try {
      const response = await fetch(`/api/orders/${cancellationModal.orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      // Update the order in the list
      setOrders(orders.map(order => 
        order._id === cancellationModal.orderId 
          ? { ...order, status: 'cancelled', cancellationRequested: true }
          : order
      ));

      // Close modal and show success message
      setCancellationModal({ isOpen: false, orderId: '', orderReference: '' });
      alert('Order cancelled successfully. You will receive a confirmation email shortly.');
    } catch (err) {
      console.error('Cancellation error:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellationLoading(false);
    }
  };

  const canCancelOrder = (order: Order) => {
    if (order.cancellationRequested) return false;
    
    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const withinCoolingOffPeriod = daysSinceOrder <= 14;
    
    // Check if production has started
    const productionStarted = order.productionStatus === 'in_production' || 
                             order.productionStatus === 'quality_check' || 
                             order.productionStatus === 'ready_to_ship' || 
                             order.productionStatus === 'completed';
    
    // Check if order has custom items
    const hasCustomItems = order.items.some(item => item.customization?.isCustomized);
    
    // UK Consumer Law: Can cancel within 14 days of receiving goods
    if (order.status === 'delivered' || order.status === 'shipped') {
      return withinCoolingOffPeriod;
    }
    
    // For pending/paid orders: Can cancel before production starts
    if (order.status === 'pending' || order.status === 'paid') {
      if (productionStarted && hasCustomItems) {
        return false; // Custom items cannot be cancelled once production starts
      }
      return !productionStarted;
    }
    
    return false;
  };

  const getCancellationStatus = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const withinCoolingOffPeriod = daysSinceOrder <= 14;
    
    const productionStarted = order.productionStatus === 'in_production' || 
                             order.productionStatus === 'quality_check' || 
                             order.productionStatus === 'ready_to_ship' || 
                             order.productionStatus === 'completed';
    
    const hasCustomItems = order.items.some(item => item.customization?.isCustomized);
    
    if (order.cancellationRequested) {
      return { canCancel: false, message: 'Cancellation already requested' };
    }
    
    if (order.status === 'cancelled') {
      return { canCancel: false, message: 'Order already cancelled' };
    }
    
    if (order.status === 'delivered' || order.status === 'shipped') {
      if (!withinCoolingOffPeriod) {
        return { canCancel: false, message: '14-day cancellation period expired' };
      }
      return { canCancel: true, message: `Can cancel until ${new Date(orderDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}` };
    }
    
    if (order.status === 'pending' || order.status === 'paid') {
      if (productionStarted && hasCustomItems) {
        return { canCancel: false, message: 'Custom items cannot be cancelled once production starts' };
      }
      if (productionStarted) {
        return { canCancel: false, message: 'Cannot cancel - production has started' };
      }
      return { canCancel: true, message: 'Can cancel before production starts' };
    }
    
    return { canCancel: false, message: 'Cannot cancel at this stage' };
  };

  const getRefundStatus = (order: Order) => {
    if (!order.metadata?.refundAmount) {
      return null;
    }

    return {
      amount: order.metadata.refundAmount,
      reason: order.metadata.refundReason || 'Order cancellation',
      notes: order.metadata.refundNotes,
      refundedAt: order.metadata.refundedAt,
      refundedBy: order.metadata.refundedBy,
      stripeRefundId: order.metadata.stripeRefundId,
    };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and track your order history
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to create your first order.</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white shadow overflow-hidden sm:rounded-lg"
              >
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order {order.reference}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Placed on {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      statusColors[order.status]
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={`${order._id}-${index}`} className="flex items-center space-x-4">
                        <div className="relative h-20 w-20 flex-shrink-0">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="object-cover rounded-md w-full h-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getImageUrl('/images/logo.jpg');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Size: {item.size}
                            {item.color && ` • ${item.color}`}
                          </p>
                          {item.customization && item.customization.isCustomized && (
                            <div className="mt-1 text-sm text-gray-500">
                              <p>Customization:</p>
                              <ul className="ml-2">
                                <li>Name: {item.customization.name}</li>
                                <li>Number: {item.customization.number}</li>
                              </ul>
                            </div>
                          )}
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900 text-right">
                          <p>RRP: £80.00</p>
                          {item.customization?.isCustomized && (
                            <p>Customization: £16.00</p>
                          )}
                          <p className="font-bold mt-1">Item Total: £{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">Shipping Address</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
                      <p>{order.shippingDetails.address}</p>
                      {order.shippingDetails.addressLine2 && (
                        <p>{order.shippingDetails.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingDetails.city}, {order.shippingDetails.county}
                      </p>
                      <p>{order.shippingDetails.postcode}</p>
                      <p>{order.shippingDetails.country}</p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const voucherInfo = formatVoucherDiscount(order);
                        if (voucherInfo) {
                          return (
                            <>
                              <div className="flex justify-between text-sm text-gray-900">
                                <p>Subtotal</p>
                                <p>£{(voucherInfo.originalTotal - order.shippingDetails.shippingCost).toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between text-sm text-gray-900">
                                <p>Shipping ({order.shippingDetails.shippingMethod})</p>
                                <p>£{order.shippingDetails.shippingCost.toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between text-sm text-purple-600 font-medium">
                                <p>Discount ({voucherInfo.code})</p>
                                <p>-£{voucherInfo.discountAmount.toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
                                <p>Total</p>
                                <p>£{voucherInfo.finalTotal.toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between mt-2 text-xs text-gray-500 italic">
                                <span>Includes VAT (20%)</span>
                                <span>£{order.vat.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <div className="flex justify-between text-sm text-gray-900">
                                <p>Subtotal</p>
                                <p>£{(order.total - order.shippingDetails.shippingCost).toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between text-sm text-gray-900">
                                <p>Shipping ({order.shippingDetails.shippingMethod})</p>
                                <p>£{order.shippingDetails.shippingCost.toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
                                <p>Total</p>
                                <p>£{order.total.toFixed(2)}</p>
                              </div>
                              <div className="flex justify-between mt-2 text-xs text-gray-500 italic">
                                <span>Includes VAT (20%)</span>
                                <span>£{order.vat.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {order.productionStatus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Production: {order.productionStatus.replace('_', ' ')}
                          </span>
                        )}
                        {order.cancellationRequested && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Cancellation Requested
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        {(() => {
                          const cancellationStatus = getCancellationStatus(order);
                          return (
                            <>
                              {cancellationStatus.canCancel ? (
                                <button
                                  onClick={() => setCancellationModal({
                                    isOpen: true,
                                    orderId: order._id,
                                    orderReference: order.reference
                                  })}
                                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Cancel Order
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500 italic">
                                  {cancellationStatus.message}
                                </span>
                              )}
                            </>
                          );
                        })()}
                        {order.cancellationRequested && order.cancellationReason && (
                          <div className="text-sm text-gray-500">
                            <p><strong>Reason:</strong> {order.cancellationReason}</p>
                            {order.cancellationNotes && (
                              <p><strong>Notes:</strong> {order.cancellationNotes}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Refund Information */}
                        {(() => {
                          const refundStatus = getRefundStatus(order);
                          if (refundStatus) {
                            return (
                              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center">
                                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <h4 className="text-sm font-medium text-green-800">Refund Processed</h4>
                                </div>
                                <div className="mt-2 text-sm text-green-700 space-y-1">
                                  <p><strong>Amount:</strong> £{refundStatus.amount.toFixed(2)}</p>
                                  <p><strong>Reason:</strong> {refundStatus.reason}</p>
                                  {refundStatus.notes && (
                                    <p><strong>Notes:</strong> {refundStatus.notes}</p>
                                  )}
                                  {refundStatus.refundedAt && (
                                    <p><strong>Processed:</strong> {formatDateTime(refundStatus.refundedAt)}</p>
                                  )}
                                  <p className="text-xs text-green-600 mt-2">
                                    Refund will appear in your account within 5-10 working days
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={cancellationModal.isOpen}
        onClose={() => setCancellationModal({ isOpen: false, orderId: '', orderReference: '' })}
        onCancel={handleCancellationRequest}
        orderReference={cancellationModal.orderReference}
        loading={cancellationLoading}
      />
      
      <Footer />
    </div>
  );
} 