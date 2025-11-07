'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminSessionDebugger() {
  const { data: session, status } = useSession();
  const [sessionCheck, setSessionCheck] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 [AdminSessionDebugger] Component mounted');
    console.log('🔍 [AdminSessionDebugger] Session status:', status);
    console.log('🔍 [AdminSessionDebugger] Session data:', session);

    // Check session via API
    const checkSession = async () => {
      try {
        console.log('🔍 [AdminSessionDebugger] Fetching session from API...');
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });
        const data = await response.json();
        console.log('🔍 [AdminSessionDebugger] API session response:', data);
        setSessionCheck(data);

        if (data?.user) {
          console.log('✅ [AdminSessionDebugger] User found:', {
            email: data.user.email,
            isAdmin: data.user.isAdmin,
            role: data.user.role
          });

          if (!data.user.isAdmin) {
            console.error('❌ [AdminSessionDebugger] User is NOT an admin!');
          } else {
            console.log('✅ [AdminSessionDebugger] User IS an admin');
          }
        } else {
          console.error('❌ [AdminSessionDebugger] No user in session');
        }
      } catch (error) {
        console.error('❌ [AdminSessionDebugger] Error fetching session:', error);
      }
    };

    checkSession();

    // Check cookies
    console.log('🔍 [AdminSessionDebugger] Document cookies:', document.cookie);
    
    // Check for NextAuth session token
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('next-auth.session-token'));
    if (sessionCookie) {
      console.log('✅ [AdminSessionDebugger] NextAuth session cookie found');
    } else {
      console.error('❌ [AdminSessionDebugger] NextAuth session cookie NOT found');
    }
  }, [session, status]);

  // Don't render anything, just log
  return null;
}

