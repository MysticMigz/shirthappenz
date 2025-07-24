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
  vat?: number;
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
    productId?: string;
    baseProductName?: string; // Added for custom designs
    baseProductImage?: string; // Added for custom designs
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      setOrder(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        console.log('Fetching order:', orderId);
        const response = await fetch(`/api/orders/${orderId}?public=1`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        console.log('Order data:', orderData);
        setOrder(orderData);
        
        // Clear the cart only if the order is paid
        if (orderData.status === 'paid') {
          clearCart();
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!searchParams.get('orderId')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-green-700 text-2xl font-bold mb-4">Thank You for Your Order!</h2>
          <p className="text-gray-700 mb-6">Your payment was successful. You will receive an order confirmation email shortly with your order details.</p>
          <Link
            href="/orders"
            className="block w-full bg-indigo-600 text-white text-center py-2 px-4 rounded hover:bg-indigo-700 mb-3"
          >
            View My Orders
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-100 text-indigo-700 text-center py-2 px-4 rounded hover:bg-gray-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Calculate subtotal, VAT (included), and total for display
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = order.shippingDetails.shippingCost;
  const total = subtotal + shipping;
  const vatIncluded = typeof order.vat === 'number'
    ? order.vat
    : Number(((subtotal + shipping) * 0.2).toFixed(2));

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
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center py-4 border-b border-gray-200 last:border-0 gap-4">
                  {/* Product Image */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">{item.name}</h3>
                    {/* Show base product info for custom designs */}
                    {item.baseProductName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Base Product: {item.baseProductName}
                      </p>
                    )}
                    {item.baseProductImage && (
                      <div className="relative h-8 w-8 mt-1 mb-1 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                        <Image
                          src={item.baseProductImage}
                          alt={item.baseProductName || 'Base Product'}
                          fill
                          className="object-contain object-center"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Size: {item.size}</p>
                    <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm lg:text-base">£{(item.price * item.quantity).toFixed(2)}</span>
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