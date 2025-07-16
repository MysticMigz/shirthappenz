'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/context/UserContext';
import { CartProvider } from '@/context/CartContext';
import { useEffect, useState, createContext, useContext } from 'react';
import { nanoid } from 'nanoid';

// VisitorId context
const VisitorIdContext = createContext<string | null>(null);
export const useVisitorId = () => useContext(VisitorIdContext);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let id = getCookie('visitorId');
    if (!id) {
      id = nanoid();
      setCookie('visitorId', id);
    }
    setVisitorId(id);
  }, []);

  return (
    <SessionProvider>
      <UserProvider>
        <CartProvider>
          <VisitorIdContext.Provider value={visitorId}>
            {children}
          </VisitorIdContext.Provider>
        </CartProvider>
      </UserProvider>
    </SessionProvider>
  );
} 