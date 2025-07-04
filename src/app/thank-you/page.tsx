'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
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
    name?: string;
    number?: string;
    isCustomized: boolean;
    nameCharacters?: number;
    numberCharacters?: number;
    customizationCost?: number;
  };
}

interface OrderDetails {
  _id: string;
  reference: string;
  status: string;
  total: number;
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
    shippingMethod: string;
    shippingCost: number;
    estimatedDeliveryDays: string;
  };
  createdAt: string;
}

interface OrderState {
  orderDetails: OrderDetails | null;
  loading: boolean;
  error: string | null;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  payment_failed: 'bg-red-100 text-red-800',
} as const;

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const paymentStatus = searchParams.get('payment_status');
  const [state, setState] = useState<OrderState>({
    orderDetails: null,
    loading: true,
    error: null
  });

  const { orderDetails, loading, error } = state;

  useEffect(() => {
    if (!orderId) {
      // If no order ID, redirect to home after a short delay
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);

      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No order ID provided. Redirecting to home...'
      }));

      return () => clearTimeout(timer);
    }

    async function fetchOrderDetails() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order details');
        }
        const data = await response.json();
        console.log('Order details:', data); // Debug log
        setState({
          orderDetails: data,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Error fetching order details:', err);
        setState({
          orderDetails: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load order details. Please try again later.'
        });
      }
    }

    fetchOrderDetails();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">No order details found.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {orderDetails?.status === 'paid' || paymentStatus === 'succeeded' ? (
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : orderDetails?.status === 'payment_failed' || paymentStatus === 'failed' ? (
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            {orderDetails?.status === 'paid' || paymentStatus === 'succeeded' ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h1>
                <p className="text-gray-600">Your payment has been processed successfully.</p>
              </>
            ) : orderDetails?.status === 'payment_failed' || paymentStatus === 'failed' ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-600">There was an issue processing your payment. Please try again.</p>
                <Link 
                  href="/checkout" 
                  className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Return to Checkout
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Received</h1>
                <p className="text-gray-600">Your order is being processed. Please complete the payment.</p>
              </>
            )}
          </div>

          {/* Order Reference */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="text-lg font-semibold text-gray-900">{orderDetails?.reference}</p>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                statusColors[orderDetails?.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
              }`}>
                {orderDetails?.status}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-4">
              {orderDetails.items.map((item, index) => {
                console.log('Item details:', item);
                return (
                  <div key={`${item.productId}-${item.size}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative h-24 w-24 flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md"
                            sizes="96px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <div className="text-sm font-medium text-gray-900">
                            £{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          <p>Size: {item.size}</p>
                          {item.color && <p>Color: {item.color}</p>}
                          <p>Quantity: {item.quantity} × £{item.price.toFixed(2)}</p>
                          
                          {/* Customization Details */}
                          {item.customization && item.customization.isCustomized && (
                            <div className="mt-2 border-t border-gray-200 pt-2">
                              <p className="font-medium text-gray-700">Customization:</p>
                              <div className="ml-2 space-y-1">
                                {item.customization.name && (
                                  <div className="flex justify-between">
                                    <p>Name: {item.customization.name}</p>
                                    <p className="text-gray-500 text-xs">
                                      ({item.customization.nameCharacters} characters × £2)
                                    </p>
                                  </div>
                                )}
                                {item.customization.number && (
                                  <div className="flex justify-between">
                                    <p>Number: {item.customization.number}</p>
                                    <p className="text-gray-500 text-xs">
                                      ({item.customization.numberCharacters} characters × £2)
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-between pt-1 text-sm font-medium text-gray-700">
                                  <p>Customization Cost:</p>
                                  <p>£{item.customization.customizationCost?.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <p>Subtotal</p>
                  <p>£{(orderDetails.total - orderDetails.shippingDetails.shippingCost).toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <p>Shipping ({orderDetails.shippingDetails.shippingMethod})</p>
                  <p>£{orderDetails.shippingDetails.shippingCost.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t border-gray-200">
                  <p>Total</p>
                  <p>£{orderDetails.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{`${orderDetails.shippingDetails.firstName} ${orderDetails.shippingDetails.lastName}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{orderDetails.shippingDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{orderDetails.shippingDetails.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {orderDetails.shippingDetails.address}
                  {orderDetails.shippingDetails.addressLine2 && <br />}
                  {orderDetails.shippingDetails.addressLine2}
                  <br />
                  {orderDetails.shippingDetails.city}
                  <br />
                  {orderDetails.shippingDetails.county}
                  <br />
                  {orderDetails.shippingDetails.postcode}
                  <br />
                  {orderDetails.shippingDetails.country}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shipping Method</p>
                <p className="font-medium">{orderDetails.shippingDetails.shippingMethod}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Estimated delivery: {orderDetails.shippingDetails.estimatedDeliveryDays}
                </p>
              </div>
            </div>
          </div>

          {/* Continue Shopping Button */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 