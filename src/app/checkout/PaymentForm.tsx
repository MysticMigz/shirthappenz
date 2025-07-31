'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';

interface PaymentFormProps {
  orderId?: string;
  total: number;
  orderData?: {
    items: any[];
    shippingDetails: any;
    voucherCode?: string;
    voucherDiscount?: number;
    voucherType?: string;
    voucherValue?: number;
    voucherId?: string;
    visitorId?: string;
    userId?: string;
  };
  onOrderProcessing?: (processing: boolean) => void;
}

export default function PaymentForm({ orderId, total, orderData, onOrderProcessing }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(undefined);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message);
        return;
      }

      // If payment was successful and we have order data, create the order
      if (paymentIntent && paymentIntent.status === 'succeeded' && orderData) {
        try {
          // Notify parent component that order is being processed
          onOrderProcessing?.(true);
          
          const vat = total * 0.2; // Calculate VAT
          
          console.log('Payment successful, creating order...');
          
          const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              items: orderData.items,
              shippingDetails: orderData.shippingDetails,
              total,
              vat,
              voucherCode: orderData.voucherCode,
              voucherDiscount: orderData.voucherDiscount,
              voucherType: orderData.voucherType,
              voucherValue: orderData.voucherValue,
              voucherId: orderData.voucherId,
              visitorId: orderData.visitorId,
              userId: orderData.userId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create order');
          }

          const result = await response.json();
          console.log('Order created successfully:', result);
          
          // Clear cart immediately
          clearCart();
          
          // Set order completed flag
          localStorage.setItem('orderCompleted', 'true');
          
          // Redirect to thank you page with order details
          const thankYouUrl = `/thank-you?orderId=${result.orderId}&reference=${result.reference}&redirect_status=succeeded`;
          console.log('Redirecting to:', thankYouUrl);
          
          // Use replace instead of push to prevent back navigation
          router.replace(thankYouUrl);
          
        } catch (err: any) {
          console.error('Error creating order:', err);
          setError('Payment successful but failed to create order. Please contact support.');
          setIsProcessing(false);
          onOrderProcessing?.(false);
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Handle 3D Secure or other authentication
        console.log('Payment requires action, redirecting...');
        router.replace(`/thank-you?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}&redirect_status=requires_action`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded but no order data - fallback
        console.log('Payment succeeded but no order data, redirecting...');
        clearCart();
        localStorage.setItem('orderCompleted', 'true');
        router.replace('/thank-you?redirect_status=succeeded');
      } else {
        // Fallback redirect
        console.log('Payment status unclear, redirecting to thank you page...');
        router.replace('/thank-you');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay £${total.toFixed(2)}`}
      </button>
    </form>
  );
} 