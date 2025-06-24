'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface OrderDetails {
  reference: string;
  status: string;
  total: number;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const orderId = searchParams.get('id');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

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
              {orderDetails ? (
                <>
                  <p className="text-lg text-gray-600 mb-4">
                    Your order has been received and is being processed.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 inline-block">
                    <p className="text-sm text-gray-600">Order Reference</p>
                    <p className="text-xl font-mono font-semibold text-gray-900">{orderDetails.reference}</p>
                  </div>
                </>
              ) : (
                <p className="text-lg text-gray-600">
                  We'll send you a confirmation email with your order details.
                </p>
              )}
            </div>

            {orderDetails && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                    <dl className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <dt className="text-sm text-gray-500">Date</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(orderDetails.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd className="text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-yellow-100 text-yellow-800">
                            {orderDetails.status}
                          </span>
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <dt className="text-sm text-gray-500">Total</dt>
                        <dd className="text-sm text-gray-900">£{orderDetails.total.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Shipping Details</h3>
                    <dl className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <dt className="text-sm text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">
                          {orderDetails.shippingDetails.firstName} {orderDetails.shippingDetails.lastName}
                        </dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{orderDetails.shippingDetails.email}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  Continue Shopping
                </Link>
              </div>
              <p className="text-center text-sm text-gray-500">
                Need help? <Link href="/contact" className="text-purple-600 hover:text-purple-500">Contact our support team</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 