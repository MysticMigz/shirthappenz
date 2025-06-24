'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
// Stripe imports - uncomment when implementing payments
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import PaymentForm from './PaymentForm';

// Initialize Stripe - uncomment when implementing payments
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CheckoutForm>({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    postcode: '',
    phone: ''
  });

  // Only redirect to cart if not processing and cart is empty
  useEffect(() => {
    if (!isProcessing && items.length === 0) {
      router.push('/cart');
    }
  }, [items, router, isProcessing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create order in database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          shippingDetails: formData,
          total: getTotal() + 4.99, // Add shipping cost
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId } = await response.json();

      // First navigate to thank-you page
      await router.push(`/thank-you?id=${orderId}`);
      
      // Then clear the cart after navigation is complete
      clearCart();
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      alert('There was an error processing your order. Please try again.');
    }
  };

  const shippingCost = 4.99;
  const subtotal = getTotal();
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                      Postcode
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium
                    ${isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Processing Order...
                    </span>
                  ) : (
                    `Place Order - £${total.toFixed(2)}`
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center py-4 border-b">
                      <div className="relative h-20 w-20 flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Size: {item.size}
                          {item.color && ` • ${item.color}`}
                        </p>
                        <div className="mt-1 text-sm text-gray-500">
                          {item.quantity} × £{item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          £{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">£{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-base font-medium text-gray-900">
                          £{total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href="/cart"
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Return to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 