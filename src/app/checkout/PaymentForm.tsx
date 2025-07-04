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
  orderId: string;
  total: number;
}

export default function PaymentForm({ orderId, total }: PaymentFormProps) {
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
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you?orderId=${orderId}`,
        },
        redirect: 'always',
      });

      if (submitError) {
        setError(submitError.message);
        return;
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