'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from './PaymentForm';
import ShippingForm, { ShippingDetails } from './ShippingForm';
import Header from '../components/Header';
import Image from 'next/image';
import { useVisitorId } from '../providers';
import { useUser } from '@/context/UserContext';

interface CheckoutStep {
  shippingDetails?: ShippingDetails & { shippingCost: number };
  clientSecret?: string;
  orderId?: string;
}

interface VoucherDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  description?: string;
  discountAmount: number;
  newTotal: number;
  voucherId?: string;
}

const DEFAULT_SHIPPING_METHOD = 'Standard Delivery';
const SHIPPING_COSTS = { 
  'Standard Delivery': 5.99, 
  'Express Delivery': 12.99,
  'Next Day Delivery': 19.99 
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal } = useCart();
  const [step, setStep] = useState<CheckoutStep>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [currentShippingMethod, setCurrentShippingMethod] = useState<keyof typeof SHIPPING_COSTS>(DEFAULT_SHIPPING_METHOD);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState<VoucherDiscount | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const visitorId = useVisitorId();
  const { user } = useUser();

  useEffect(() => {
    if (!items.length) {
      router.push('/cart');
    }
  }, [items, router]);

  const handleShippingMethodChange = (shippingMethod: keyof typeof SHIPPING_COSTS) => {
    setCurrentShippingMethod(shippingMethod);
    // No need to recalculate voucher discount - it should remain the same
    // Only the total will change based on the new shipping cost
  };

  const handleVoucherValidation = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    try {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingCost = SHIPPING_COSTS[currentShippingMethod];
      
      // Only use subtotal for voucher validation, not the total with shipping
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode.trim(),
          orderTotal: subtotal, // Send subtotal in pounds, not pence
          items
        }),
      });

      const data = await response.json();

             if (response.ok) {
         // The voucher validation returns discountAmount in pence
         const voucher = data.voucher;
         setVoucherDiscount(voucher);
         setVoucherError(null);
       } else {
        setVoucherError(data.error);
        setVoucherDiscount(null);
      }
    } catch (error) {
      setVoucherError('Failed to validate voucher code');
      setVoucherDiscount(null);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucherCode('');
    setVoucherDiscount(null);
    setVoucherError(null);
  };

  const handleShippingSubmit = async (shippingDetails: ShippingDetails & { shippingCost: number }) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subtotal + shippingDetails.shippingCost;
      
             // Apply voucher discount if available
       let finalTotal;
       if (voucherDiscount) {
         // Calculate: (subtotal - discount) + shipping
         const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
         const discountAmount = voucherDiscount.discountAmount; // Already in pounds
         const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
         finalTotal = Number((discountedSubtotal + shippingDetails.shippingCost).toFixed(2));
         
         console.log('Payment intent calculation:', {
           subtotal,
           discountAmount,
           discountedSubtotal,
           shippingCost: shippingDetails.shippingCost,
           finalTotal
         });
       } else {
         finalTotal = total;
       }

              // Do NOT create order first. Instead, send all data to payment intent creation.
        const paymentResponse = await fetch('/api/payment/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            items,
            shippingDetails,
            voucherCode: voucherDiscount?.code || null,
            voucherDiscount: voucherDiscount ? voucherDiscount.discountAmount * 100 : 0, // Convert to pence for storage
            voucherType: voucherDiscount?.type || null,
            voucherValue: voucherDiscount?.value || null,
            voucherId: voucherDiscount?.voucherId || null, // Store voucher ID for reference
            visitorId, // Add visitorId to payment intent metadata
            userId: user?._id || null // Pass userId if logged in
          }),
        });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await paymentResponse.json();

      setStep({
        shippingDetails,
        clientSecret,
        // orderId: orderData.orderId // No orderId yet, will be created after payment
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    let friendlyError = error;
    if (error.toLowerCase().includes('insufficient stock')) {
      friendlyError = 'Sorry, one or more items in your cart are no longer available in the requested quantity. Please review your cart and try again.';
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-red-100">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-red-600 text-xl font-semibold">Error Occurred</h2>
          </div>
          <p className="text-gray-600 mb-6">{friendlyError}</p>
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Return to Cart</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

    // Calculate subtotal, VAT (included), and total for display
  console.log('Cart items:', items);
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    console.log(`Item: ${item.name}, Price: £${item.price}, Quantity: ${item.quantity}, Total: £${itemTotal}`);
    return sum + itemTotal;
  }, 0);
  console.log('Calculated subtotal:', subtotal);
  
  // Debug voucher discount calculation
  if (voucherDiscount) {
    console.log('Voucher discount details:', {
      code: voucherDiscount.code,
      type: voucherDiscount.type,
      value: voucherDiscount.value,
      discountAmount: voucherDiscount.discountAmount,
      discountAmountInPounds: voucherDiscount.discountAmount
    });
  }
  const shippingCost = SHIPPING_COSTS[currentShippingMethod];
  const vatRate = 0.2;
  const total = subtotal + shippingCost;
   
  // Calculate final total with voucher discount
  let finalTotal;
  if (voucherDiscount) {
    // Calculate: Subtotal - Discount + Shipping = Total
    const discountAmount = voucherDiscount.discountAmount; // Already in pounds
    const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
    finalTotal = Number((discountedSubtotal + shippingCost).toFixed(2));
    console.log('Final total calculation (Subtotal - Discount + Shipping):', {
      subtotal,
      discountAmount,
      discountedSubtotal,
      shippingCost,
      finalTotal
    });
  } else {
    // No voucher: Subtotal + Shipping = Total
    finalTotal = Number((subtotal + shippingCost).toFixed(2));
    console.log('Final total calculation (Subtotal + Shipping):', {
      subtotal,
      shippingCost,
      finalTotal
    });
  }
  
  // VAT is 20% of the final total (after voucher discount)
  const vatIncluded = Number((finalTotal * 0.2).toFixed(2));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Order Summary - Takes up 2 columns */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.productId + item.size} className="flex items-center py-4 border-b border-gray-200 last:border-0 gap-4">
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
                    {/* Voucher Code Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Have a voucher code?</h3>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isValidatingVoucher}
                          />
                          <button
                            onClick={handleVoucherValidation}
                            disabled={!voucherCode.trim() || isValidatingVoucher}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isValidatingVoucher ? 'Validating...' : 'Apply'}
                          </button>
                        </div>
                        {voucherError && (
                          <p className="text-red-500 text-xs mt-1">{voucherError}</p>
                        )}
                        {voucherDiscount && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center justify-between">
                              <div>
                                                                 <p className="text-sm font-medium text-green-800">
                                   {voucherDiscount.code} - {voucherDiscount.type === 'percentage' ? `${voucherDiscount.value}% off` : `£${voucherDiscount.value.toFixed(2)} off`}
                                 </p>
                                {voucherDiscount.description && (
                                  <p className="text-xs text-green-600">{voucherDiscount.description}</p>
                                )}
                              </div>
                              <button
                                onClick={removeVoucher}
                                className="text-green-600 hover:text-green-800"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subtotal, Shipping, and Total (VAT included) */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between mb-2 text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>£{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2 text-sm text-gray-500">
                        <span>Shipping ({currentShippingMethod})</span>
                        <span>£{shippingCost.toFixed(2)}</span>
                      </div>
                                             {voucherDiscount && (
                         <div className="flex justify-between mb-2 text-sm text-green-600">
                           <span>Discount ({voucherDiscount.code})</span>
                           <span>-£{voucherDiscount.discountAmount.toFixed(2)}</span>
                         </div>
                       )}
                      <div className="flex justify-between text-lg font-bold text-gray-900 mt-4">
                        <span>Total</span>
                        <span>£{finalTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500 italic">
                        <span>Includes VAT (20%)</span>
                        <span>£{vatIncluded.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section - Takes up 3 columns */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Processing your order...</p>
                  </div>
                ) : step.clientSecret && step.shippingDetails ? (
                  <div className="bg-white rounded-lg">
                    <StripeProvider clientSecret={step.clientSecret}>
                      <PaymentForm 
                        total={finalTotal} 
                      />
                    </StripeProvider>
                  </div>
                ) : (
                  <ShippingForm 
                    onSubmit={handleShippingSubmit}
                    onShippingMethodChange={handleShippingMethodChange}
                    currentShippingMethod={currentShippingMethod}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 