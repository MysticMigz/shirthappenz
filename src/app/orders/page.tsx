'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
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

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                      Placed on {formatDate(order.createdAt)}
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
                          <p>Base: £80.00</p>
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
                        <span>£{(order.total * 0.2 / 1.2).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 