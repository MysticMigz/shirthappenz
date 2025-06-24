'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
}

interface OrderDetails {
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
} as const;

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [state, setState] = useState<{
    orderDetails: OrderDetails | null;
    loading: boolean;
    error: string | null;
  }>({
    orderDetails: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!orderId) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No order ID provided'
      }));
      return;
    }

    async function fetchOrderDetails() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setState({
          orderDetails: data,
          loading: false,
          error: null
        });
      } catch (err) {
        setState({
          orderDetails: null,
          loading: false,
          error: 'Failed to load order details. Please try again later.'
        });
        console.error('Error fetching order details:', err);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  if (state.loading) {
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

  if (state.error || !state.orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
              <p className="text-gray-600 mb-6">{state.error || 'Unable to load order details'}</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { orderDetails } = state;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h1>
              <p className="text-lg text-gray-600 mb-4">
                Your order has been received and is being processed.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-600">Order Reference</p>
                <p className="text-xl font-mono font-semibold text-gray-900">{orderDetails.reference}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-8">
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-4">
                    {orderDetails?.items?.map((item, index) => (
                      <div key={`${item.productId}-${item.size}-${index}`} className="flex items-center space-x-4">
                        <div className="relative h-20 w-20 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                              sizes="80px"
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
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity} × £{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          £{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Total</p>
                      <p>£{orderDetails.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Details</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="mt-1">{orderDetails.shippingDetails.firstName} {orderDetails.shippingDetails.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1">{orderDetails.shippingDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="mt-1">{orderDetails.shippingDetails.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <div className="mt-1">
                          <p>{orderDetails.shippingDetails.address}</p>
                          {orderDetails.shippingDetails.addressLine2 && (
                            <p>{orderDetails.shippingDetails.addressLine2}</p>
                          )}
                          <p>
                            {orderDetails.shippingDetails.city}, {orderDetails.shippingDetails.county}
                          </p>
                          <p>{orderDetails.shippingDetails.postcode}</p>
                          <p>{orderDetails.shippingDetails.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[orderDetails.status as keyof typeof statusColors]
                  }`}>
                    {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1).replace('_', ' ')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-x-4 flex justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 