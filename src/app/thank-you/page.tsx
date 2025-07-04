'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { getImageUrl } from '@/lib/utils';

interface OrderDetails {
  _id: string;
  reference: string;
  status: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size: string;
    color?: string;
    image?: string;
    customization?: {
      name?: string;
      number?: string;
    };
    rrp?: number;
  }>;
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
    estimatedDeliveryDays?: string;
  };
  createdAt: string;
}

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      setError('No order ID provided.');
      return;
    }

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}?public=1`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        setOrder(orderData);
        
        // Clear the cart only if the order is paid
        if (orderData.status === 'paid') {
          clearCart();
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchOrder();
  }, [searchParams, clearCart]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 mb-3"
          >
            Try Again
          </button>
          <Link
            href="/contact"
            className="block w-full bg-gray-100 text-indigo-700 text-center py-2 px-4 rounded hover:bg-gray-200"
          >
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate subtotal, VAT (included), and total for display
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = order.shippingDetails.shippingCost;
  const total = subtotal + shipping;
  const vatRate = 0.2;
  const vatIncluded = total * vatRate / (1 + vatRate);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h1>
            <p className="text-gray-600">
              Your order has been {order.status === 'paid' ? 'confirmed' : 'received'}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Order Reference:</p>
                <p className="font-medium">{order.reference}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Date:</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount:</p>
                <p className="font-medium">£{order.total.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Shipping Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-medium">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-medium">{order.shippingDetails.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone:</p>
                <p className="font-medium">{order.shippingDetails.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Address:</p>
                <p className="font-medium">{order.shippingDetails.address}, {order.shippingDetails.city}, {order.shippingDetails.county}, {order.shippingDetails.postcode}, {order.shippingDetails.country}</p>
              </div>
              <div>
                <p className="text-gray-600">Shipping Method:</p>
                <p className="font-medium">{order.shippingDetails.shippingMethod}</p>
              </div>
              <div>
                <p className="text-gray-600">Shipping Cost:</p>
                <p className="font-medium">£{order.shippingDetails.shippingCost.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start border-b border-gray-200 pb-4 gap-4"
                >
                  <div className="flex items-center gap-4">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-md border border-gray-200">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Size: {item.size}</p>
                      {item.color && <p className="text-sm text-gray-600">Color: {item.color}</p>}
                      {item.customization && (
                        <div className="text-sm text-gray-600">
                          {item.customization.name && (
                            <p>Name: {item.customization.name}</p>
                          )}
                          {item.customization.number && (
                            <p>Number: {item.customization.number}</p>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      {/* RRP and Offer Price */}
                      {item.rrp && item.rrp > item.price ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 line-through">RRP: £{item.rrp.toFixed(2)}</span>
                          <span className="text-sm font-bold text-green-700">Offer: £{item.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-gray-900 mt-1">Price: £{item.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <p className="font-medium">
                    £{(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  £{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping ({order.shippingDetails.shippingMethod})</span>
                <span className="font-medium">
                  £{shipping.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-4">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 italic">
                <span>Includes VAT (20%)</span>
                <span>£{vatIncluded.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/orders"
                className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 