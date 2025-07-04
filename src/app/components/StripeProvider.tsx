'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { StripeElementsOptions } from '@stripe/stripe-js';

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
}

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
} 