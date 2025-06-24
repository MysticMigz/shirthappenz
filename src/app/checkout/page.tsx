'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ total, onSuccess, onError }: { 
  total: number; 
  onSuccess: () => void; 
  onError: (error: string) => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      // Create payment intent
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          // Add any other necessary data
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        setPaymentError(error.message || 'An error occurred');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setPaymentError('An error occurred while processing your payment');
      onError('Payment failed');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      {paymentError && (
        <div className="text-red-600 text-sm">{paymentError}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full px-4 py-3 text-white font-medium rounded-lg ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Customer Information
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    
    // Shipping Address
    address: '',
    apartment: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    
    // Billing Address
    billingDifferent: false,
    billingAddress: '',
    billingApartment: '',
    billingCity: '',
    billingCounty: '',
    billingPostcode: '',
    billingCountry: 'United Kingdom',
    
    // Shipping Method
    shippingMethod: 'standard',
    
    // Payment
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Order Notes
    orderNotes: ''
  });

  // Mock cart items
  const cartItems = [
    {
      id: 1,
      name: 'Custom T-Shirt - Navy',
      design: 'Custom Design #1',
      size: 'Large',
      quantity: 2,
      price: 10.00,
      image: '/api/placeholder/80/80'
    },
    {
      id: 2,
      name: 'Premium Hoodie - Black',
      design: 'Logo Print',
      size: 'Medium',
      quantity: 1,
      price: 29.00,
      image: '/api/placeholder/80/80'
    }
  ];

  const shippingOptions = [
    { id: 'standard', name: 'Standard Delivery', time: '3-5 working days', price: 3.99 },
    { id: 'express', name: 'Express Delivery', time: '1-2 working days', price: 7.99 },
    { id: 'next-day', name: 'Next Day Delivery', time: 'Next working day', price: 12.99 }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedShipping = shippingOptions.find(option => option.id === formData.shippingMethod);
  const shippingCost = selectedShipping?.price || 0;
  const vatRate = 0.20;
  const vatAmount = (subtotal + shippingCost) * vatRate;
  const total = subtotal + shippingCost + vatAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayPalCreateOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "GBP",
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "GBP",
              value: subtotal.toFixed(2)
            },
            shipping: {
              currency_code: "GBP",
              value: shippingCost.toFixed(2)
            },
            tax_total: {
              currency_code: "GBP",
              value: vatAmount.toFixed(2)
            }
          }
        },
        items: cartItems.map(item => ({
          name: item.name,
          description: item.design,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: "GBP",
            value: item.price.toFixed(2)
          }
        }))
      }]
    });
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    try {
      const order = await actions.order.capture();
      // Here you would typically:
      // 1. Send the order details to your backend
      // 2. Create the order in your database
      // 3. Send confirmation email
      // 4. Redirect to thank you page
      window.location.href = '/thank-you';
    } catch (error) {
      console.error('PayPal payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handlePaymentSuccess = () => {
    // Handle successful payment
    window.location.href = '/thank-you';
  };

  const handlePaymentError = (error: string) => {
    // Handle payment error
    alert(error);
  };

  const handleDemoCheckout = () => {
    alert('Payment processing is temporarily unavailable. Please check back later.');
  };

  return (
    <PayPalScriptProvider options={{ 
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
      currency: "GBP"
    }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo5.png"
                alt="ShirtHappenZ Logo"
                width={180}
                height={60}
                className="h-12 w-auto brightness-110"
              />
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step <= currentStep 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {step}
                    </div>
                    <div className="ml-3">
                      <p className={`font-medium ${step <= currentStep ? 'text-purple-600' : 'text-gray-400'}`}>
                        {step === 1 && 'Customer Info'}
                        {step === 2 && 'Shipping & Payment'}
                        {step === 3 && 'Review Order'}
                      </p>
                    </div>
                    {step < 3 && (
                      <div className={`hidden md:block w-20 h-0.5 ml-8 ${
                        step < currentStep ? 'bg-purple-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {/* Step 1: Customer Information */}
                  {currentStep === 1 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="your@email.com"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name *
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="+44 7123 456789"
                          />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Shipping Address</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="123 Main Street"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apartment, suite, etc. (optional)
                          </label>
                          <input
                            type="text"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Apartment, suite, unit, etc."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              County
                            </label>
                            <input
                              type="text"
                              name="county"
                              value={formData.county}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postcode *
                            </label>
                            <input
                              type="text"
                              name="postcode"
                              value={formData.postcode}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="SW1A 1AA"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          >
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Ireland">Ireland</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Shipping & Payment */}
                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping & Payment</h2>
                      
                      <div className="space-y-8">
                        {/* Shipping Options */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
                          <div className="space-y-3">
                            {shippingOptions.map((option) => (
                              <label key={option.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name="shippingMethod"
                                  value={option.id}
                                  checked={formData.shippingMethod === option.id}
                                  onChange={handleInputChange}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-900">{option.name}</p>
                                      <p className="text-sm text-gray-500">{option.time}</p>
                                    </div>
                                    <p className="font-medium text-gray-900">£{option.price.toFixed(2)}</p>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                          <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                              <p className="text-yellow-800">
                                Payment processing is temporarily unavailable. We're working on bringing you secure payment options including Credit/Debit Cards, Apple Pay, and PayPal. Please check back later.
                              </p>
                            </div>
                            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="card"
                                checked={formData.paymentMethod === 'card'}
                                onChange={handleInputChange}
                                disabled
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">Credit / Debit Card</p>
                                <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                              </div>
                            </label>

                            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="apple-pay"
                                checked={formData.paymentMethod === 'apple-pay'}
                                onChange={handleInputChange}
                                disabled
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">Apple Pay</p>
                                    <p className="text-sm text-gray-500">Quick and secure payment with Apple Pay</p>
                                  </div>
                                  <img 
                                    src="/images/apple-pay.svg" 
                                    alt="Apple Pay" 
                                    className="w-32 h-12 object-contain"
                                  />
                                </div>
                              </div>
                            </label>
                            
                            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                checked={formData.paymentMethod === 'paypal'}
                                onChange={handleInputChange}
                                disabled
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">PayPal</p>
                                    <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                                  </div>
                                  <img 
                                    src="https://img.icons8.com/color/96/paypal.png" 
                                    alt="PayPal" 
                                    className="w-32 h-12 object-contain"
                                  />
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Order Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order Notes (Optional)
                          </label>
                          <textarea
                            name="orderNotes"
                            value={formData.orderNotes}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Special instructions for your order..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review Order */}
                  {currentStep === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                      
                      <div className="space-y-6">
                        {/* Customer Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                          <p className="text-gray-700">{formData.firstName} {formData.lastName}</p>
                          <p className="text-gray-700">{formData.email}</p>
                          {formData.phone && <p className="text-gray-700">{formData.phone}</p>}
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                          <p className="text-gray-700">{formData.address}</p>
                          {formData.apartment && <p className="text-gray-700">{formData.apartment}</p>}
                          <p className="text-gray-700">{formData.city}, {formData.county} {formData.postcode}</p>
                          <p className="text-gray-700">{formData.country}</p>
                        </div>

                        {/* Shipping Method */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Delivery Method</h3>
                          <p className="text-gray-700">{selectedShipping?.name} - {selectedShipping?.time}</p>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                          <p className="text-gray-700">
                            {formData.paymentMethod === 'card' ? 'Credit/Debit Card' : formData.paymentMethod === 'apple-pay' ? 'Apple Pay' : 'PayPal'}
                            {formData.paymentMethod === 'card' && formData.cardNumber && 
                              ` ending in ${formData.cardNumber.slice(-4)}`
                            }
                          </p>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              id="terms"
                              className="mt-1 text-purple-600 focus:ring-purple-500"
                              required
                            />
                            <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                              I agree to the <Link href="/terms" className="text-purple-600 hover:text-purple-800">Terms of Service</Link> and <Link href="/privacy" className="text-purple-600 hover:text-purple-800">Privacy Policy</Link>
                            </label>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <p className="text-yellow-800">
                            Note: This is a demo checkout. Payment processing is currently unavailable.
                          </p>
                        </div>

                        <button
                          onClick={handleDemoCheckout}
                          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Demo Checkout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between">
                    {currentStep > 1 && (
                      <button
                        onClick={handlePrevStep}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {currentStep < 3 && (
                      <button
                        onClick={handleNextStep}
                        className="ml-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white text-xs px-2 py-1 rounded">
                            ShirtHappenZ
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.design}</p>
                          <p className="text-xs text-gray-500">Size: {item.size}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <span className="font-medium text-gray-900">£{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">£{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT (20%)</span>
                      <span className="text-gray-900">£{vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">£{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-800">Secure SSL encrypted checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutPage; 