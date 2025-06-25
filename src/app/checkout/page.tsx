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
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  phone: string;
  shippingMethod: string;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Royal Mail 2nd Class',
    price: 4.99,
    estimatedDays: '3-5 working days'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Royal Mail 1st Class',
    price: 6.99,
    estimatedDays: '1-2 working days'
  },
  {
    id: 'next-day',
    name: 'Next Day Delivery',
    description: 'DPD Next Working Day',
    price: 9.99,
    estimatedDays: 'Next working day if ordered before 2pm'
  }
];

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
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    phone: '',
    shippingMethod: 'standard'
  });

  // Only redirect to cart if not processing and cart is empty
  useEffect(() => {
    if (!isProcessing && items.length === 0) {
      router.push('/cart');
    }
  }, [items, router, isProcessing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      // Get selected shipping option details
      const selectedShipping = shippingOptions.find(option => option.id === formData.shippingMethod);
      
      // Create order in database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            ...item,
            customization: item.customization ? {
              name: item.customization.name,
              number: item.customization.number,
              isCustomized: true,
              nameCharacters: item.customization.name?.length || 0,
              numberCharacters: item.customization.number?.length || 0,
              customizationCost: ((item.customization.name?.length || 0) + (item.customization.number?.length || 0)) * 2
            } : undefined
          })),
          shippingDetails: {
            ...formData,
            shippingMethod: selectedShipping?.name || 'Standard Delivery',
            shippingCost: selectedShipping?.price || 4.99,
            estimatedDeliveryDays: selectedShipping?.estimatedDays || '3-5 working days'
          },
          total: getTotal() + (selectedShipping?.price || 4.99),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      
      if (!data._id) {
        throw new Error('No order ID received');
      }

      // Clear cart before redirecting
      clearCart();
      
      // Use replace instead of push to prevent going back to checkout
      router.replace(`/thank-you?id=${data._id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      alert(error instanceof Error ? error.message : 'There was an error processing your order. Please try again.');
    }
  };

  const selectedShipping = shippingOptions.find(option => option.id === formData.shippingMethod);
  const shippingCost = selectedShipping?.price || 4.99;
  const subtotal = getTotal();
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-8">
              {/* Shipping Information */}
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
                      Phone Number
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
                      Address Line 1
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

                  <div>
                    <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
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
                      <label htmlFor="county" className="block text-sm font-medium text-gray-700">
                        County
                      </label>
                      <input
                        type="text"
                        id="county"
                        name="county"
                        value={formData.county}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Ireland">Ireland</option>
                        <option value="France">France</option>
                        <option value="Germany">Germany</option>
                        <option value="Spain">Spain</option>
                        <option value="Italy">Italy</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Norway">Norway</option>
                        <option value="Finland">Finland</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Method Selection */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Method</h3>
                    <div className="space-y-4">
                      {shippingOptions.map((option) => (
                        <div key={option.id} className="relative">
                          <input
                            type="radio"
                            id={option.id}
                            name="shippingMethod"
                            value={option.id}
                            checked={formData.shippingMethod === option.id}
                            onChange={handleInputChange}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.id}
                            className="flex items-center justify-between p-4 border rounded-lg cursor-pointer
                              peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:bg-gray-50"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{option.name}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                              <div className="text-sm text-gray-500">{option.estimatedDays}</div>
                            </div>
                            <div className="text-lg font-medium text-gray-900">
                              £{option.price.toFixed(2)}
                            </div>
                          </label>
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full border
                            peer-checked:border-purple-600 peer-checked:bg-purple-600 peer-checked:flex
                            items-center justify-center hidden">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                              <path
                                d="M3.72 6.96l1.44 1.44 3.12-3.12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      ))}
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
            </div>

            {/* Order Summary */}
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
                      </p>
                      {/* Customization Details */}
                      {item.customization?.isCustomized && (
                        <div className="mt-1 space-y-1">
                          {item.customization.name && (
                            <p className="text-sm text-gray-600">
                              Name: {item.customization.name}
                              <span className="text-xs text-gray-500 ml-2">
                                ({item.customization.name.length} × £2)
                              </span>
                            </p>
                          )}
                          {item.customization.number && (
                            <p className="text-sm text-gray-600">
                              Number: {item.customization.number}
                              <span className="text-xs text-gray-500 ml-2">
                                ({item.customization.number.length} × £2)
                              </span>
                            </p>
                          )}
                        </div>
                      )}
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
                    <span className="text-gray-600">
                      Shipping ({selectedShipping?.name})
                      <div className="text-xs text-gray-500">{selectedShipping?.estimatedDays}</div>
                    </span>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 