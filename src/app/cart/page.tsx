'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Custom T-Shirt',
      design: 'Custom Design #1',
      color: 'Navy',
      size: 'Large',
      quantity: 2,
      price: 10.00,
      image: '/api/placeholder/150/150'
    },
    {
      id: 2,
      name: 'Premium Hoodie',
      design: 'Logo Print',
      color: 'Black',
      size: 'Medium',
      quantity: 1,
      price: 29.00,
      image: '/api/placeholder/150/150'
    }
  ]);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingEstimate = 3.99;
  const vatRate = 0.20;
  const vatAmount = (subtotal + shippingEstimate) * vatRate;
  const total = subtotal + shippingEstimate + vatAmount;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M9 13h6" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start designing your custom apparel!</p>
              <Link
                href="/products"
                className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({cartItems.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white text-xs px-2 py-1 rounded">
                            ShirtHappenZ
                          </div>
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-1">{item.design}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Color: {item.color}</span>
                            <span>Size: {item.size}</span>
                          </div>
                          
                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 border-x border-gray-300">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                £{(item.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                £{item.price.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-3 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove item
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Continue Shopping */}
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center text-purple-600 hover:text-purple-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping (estimate)</span>
                    <span className="text-gray-900">£{shippingEstimate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (20%)</span>
                    <span className="text-gray-900">£{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">£{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Link
                  href="/checkout"
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all text-center block"
                >
                  Proceed to Checkout
                </Link>
                
                {/* Payment Methods */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">We accept:</p>
                                    <div className="flex space-x-3">
                    {/* Visa */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/visa.png" 
                        alt="Visa" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                    
                    {/* Mastercard */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/mastercard.png" 
                        alt="Mastercard" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                     
                    {/* American Express */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/amex.png" 
                        alt="American Express" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                     
                    {/* PayPal */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/paypal.png" 
                        alt="PayPal" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                     
                    {/* Apple Pay */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/apple-pay.png" 
                        alt="Apple Pay" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                     
                    {/* Google Pay */}
                    <div className="w-16 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                      <Image
                        src="https://img.icons8.com/color/48/google-pay.png" 
                        alt="Google Pay" 
                        width={48}
                        height={48}
                        className="w-12 h-8 object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Security Badge */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.414-4.414a2 2 0 00-2.828 0L10 5.172 8.414 3.586a2 2 0 00-2.828 0l-6 6a2 2 0 000 2.828l6 6a2 2 0 002.828 0L10 16.414l1.586 1.586a2 2 0 002.828 0l6-6a2 2 0 000-2.828l-6-6z" />
                    </svg>
                    <span className="text-sm text-green-800">Secure SSL checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 