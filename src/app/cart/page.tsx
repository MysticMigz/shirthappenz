'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (productId: string, size: string, newQuantity: number, customization?: { name?: string; number?: string }) => {
    if (newQuantity >= 0 && newQuantity <= 10) {
      updateQuantity(productId, size, newQuantity, customization);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to proceed to checkout:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link
                href="/"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={`${item.productId}-${item.size}`} className="p-6">
                        <div className="flex items-center space-x-6">
                          {/* Product Image */}
                          <div className="flex gap-2">
                            {/* Custom Design: Show front and back if available */}
                            {item.customization?.isCustomized && (item.customization.frontImage || item.customization.backImage) ? (
                              <>
                                {item.customization.frontImage && (
                                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={item.customization.frontImage}
                                      alt={item.name + ' (Front)'}
                                      fill
                                      className="object-cover object-center"
                                    />
                                    <span className="absolute bottom-1 left-1 bg-white bg-opacity-80 text-xs px-1 rounded">Front</span>
                                  </div>
                                )}
                                {item.customization.backImage && (
                                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={item.customization.backImage}
                                      alt={item.name + ' (Back)'}
                                      fill
                                      className="object-cover object-center"
                                    />
                                    <span className="absolute bottom-1 left-1 bg-white bg-opacity-80 text-xs px-1 rounded">Back</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover object-center"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400">No image</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  <Link href={`/product/${item.productId}`} className="hover:text-purple-600">
                                    {item.name}
                                  </Link>
                                </h3>
                                {/* Show base product info for custom designs */}
                                {item.baseProductName && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Base Product: {item.baseProductName}
                                  </p>
                                )}
                                {/* Optionally show base product image for custom designs */}
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
                                <div className="mt-1 space-y-1">
                                  <p className="text-sm text-gray-500">
                                    Size: {item.size}
                                  </p>
                                  
                                  {/* Customization Details */}
                                  {item.customization?.isCustomized && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm font-medium text-gray-900">Customization Details:</p>
                                      {item.customization.name && (
                                        <p className="text-sm text-gray-600">
                                          Name: {item.customization.name}
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({item.customization.name.replace(/\s/g, '').length} characters × £2)
                                          </span>
                                        </p>
                                      )}
                                      {item.customization.number && (
                                        <p className="text-sm text-gray-600">
                                          Number: {item.customization.number}
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({item.customization.number.length} digits × £2)
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Price Breakdown */}
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-900">
                                      Price: £{item.price.toFixed(2)}
                                      {item.customization?.isCustomized && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          (includes customization)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeItem(
                                  item.productId, 
                                  item.size, 
                                  item.customization?.isCustomized ? {
                                    name: item.customization.name,
                                    number: item.customization.number
                                  } : undefined
                                )}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>

                            {/* Quantity Controls */}
                            <div className="mt-4 flex items-center">
                              <label htmlFor={`quantity-${item.productId}-${item.size}`} className="mr-2 text-sm text-gray-600">
                                Quantity:
                              </label>
                              <div className="flex items-center border rounded-md">
                                <button
                                  onClick={() => handleQuantityChange(
                                    item.productId, 
                                    item.size, 
                                    item.quantity - 1,
                                    item.customization?.isCustomized ? {
                                      name: item.customization.name,
                                      number: item.customization.number
                                    } : undefined
                                  )}
                                  className="px-3 py-1 border-r hover:bg-gray-50"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="px-4 py-1">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(
                                    item.productId, 
                                    item.size, 
                                    item.quantity + 1,
                                    item.customization?.isCustomized ? {
                                      name: item.customization.name,
                                      number: item.customization.number
                                    } : undefined
                                  )}
                                  className="px-3 py-1 border-l hover:bg-gray-50"
                                  disabled={item.quantity >= 10}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                  
                                     <div className="space-y-4">
                     {/* Item Details */}
                     {items.map((item) => (
                       <div key={`${item.productId}-${item.size}`} className="border-b border-gray-200 pb-3">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <p className="text-sm font-medium text-gray-900">{item.name}</p>
                             <p className="text-xs text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                             {item.customization?.isCustomized && (
                               <div className="mt-1 text-xs text-gray-600">
                                 {item.customization.name && (
                                   <p>Name: {item.customization.name} ({item.customization.name.replace(/\s/g, '').length} chars)</p>
                                 )}
                                 {item.customization.number && (
                                   <p>Number: {item.customization.number} ({item.customization.number.length} digits)</p>
                                 )}
                               </div>
                             )}
                           </div>
                           <span className="text-sm font-medium text-gray-900">£{(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                       </div>
                     ))}
                     
                     <div className="flex justify-between">
                       <span className="text-gray-600">Subtotal</span>
                       <span className="text-gray-900">£{getTotal().toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Shipping</span>
                       <span className="text-gray-900">Calculated at checkout</span>
                     </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-medium text-gray-900">Total</span>
                        <span className="text-lg font-medium text-gray-900">
                          £{getTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className={`w-full py-3 px-4 rounded-md text-black font-medium
                        ${isProcessing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent'
                        }`}
                    >
                      {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full mt-2 py-3 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 