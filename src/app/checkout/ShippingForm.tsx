'use client';

import { useState, useEffect } from 'react';

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  postcode: string;
  shippingMethod: 'Standard Delivery' | 'Express Delivery' | 'Next Day Delivery';
}

interface ShippingFormProps {
  onSubmit: (shippingDetails: ShippingDetails & { shippingCost: number }) => void;
  onShippingMethodChange?: (shippingMethod: keyof typeof SHIPPING_COSTS) => void;
  currentShippingMethod?: keyof typeof SHIPPING_COSTS;
}

const SHIPPING_COSTS = {
  'Standard Delivery': 5.99,
  'Express Delivery': 12.99,
  'Next Day Delivery': 19.99
};

export default function ShippingForm({ onSubmit, onShippingMethodChange, currentShippingMethod }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    county: '',
    postcode: '',
    shippingMethod: currentShippingMethod || 'Standard Delivery'
  });

  // Update form data when currentShippingMethod prop changes
  useEffect(() => {
    if (currentShippingMethod && currentShippingMethod !== formData.shippingMethod) {
      setFormData(prev => ({ ...prev, shippingMethod: currentShippingMethod }));
    }
  }, [currentShippingMethod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      shippingCost: SHIPPING_COSTS[formData.shippingMethod]
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If shipping method changed, notify parent component
    if (name === 'shippingMethod' && onShippingMethodChange) {
      onShippingMethodChange(value as keyof typeof SHIPPING_COSTS);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg">
        {/* Contact Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="John"
              />
            </div>
            <div className="relative">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>

            <div className="relative">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="+44 123 456 7890"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="London"
                />
              </div>
              <div className="relative">
                <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                  County *
                </label>
                <input
                  type="text"
                  id="county"
                  name="county"
                  required
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Greater London"
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode *
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                required
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="SW1A 1AA"
              />
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Method</h3>
          <div className="space-y-3">
            <label className="relative flex p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-all duration-200">
              <input
                type="radio"
                name="shippingMethod"
                value="Standard Delivery"
                checked={formData.shippingMethod === 'Standard Delivery'}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${formData.shippingMethod === 'Standard Delivery' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'} flex items-center justify-center`}>
                  {formData.shippingMethod === 'Standard Delivery' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Standard Delivery</p>
                  <p className="text-sm text-gray-500">3-5 business days</p>
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-sm font-medium text-gray-900">£5.99</p>
              </div>
            </label>

            <label className="relative flex p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-all duration-200">
              <input
                type="radio"
                name="shippingMethod"
                value="Express Delivery"
                checked={formData.shippingMethod === 'Express Delivery'}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${formData.shippingMethod === 'Express Delivery' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'} flex items-center justify-center`}>
                  {formData.shippingMethod === 'Express Delivery' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Express Delivery</p>
                  <p className="text-sm text-gray-500">1-2 business days</p>
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-sm font-medium text-gray-900">£12.99</p>
              </div>
            </label>

            <label className="relative flex p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-all duration-200">
              <input
                type="radio"
                name="shippingMethod"
                value="Next Day Delivery"
                checked={formData.shippingMethod === 'Next Day Delivery'}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${formData.shippingMethod === 'Next Day Delivery' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'} flex items-center justify-center`}>
                  {formData.shippingMethod === 'Next Day Delivery' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Next Day Delivery</p>
                  <p className="text-sm text-gray-500">Next business day</p>
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-sm font-medium text-gray-900">£19.99</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium text-lg"
      >
        <span>Continue to Payment</span>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
} 