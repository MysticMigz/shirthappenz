'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/context/UserContext';
import { CartProvider } from '@/context/CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </UserProvider>
    </SessionProvider>
  );
} 