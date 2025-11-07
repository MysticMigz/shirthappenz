import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  const response = NextResponse.json({ 
    message: 'Cookies cleared. Please log in again.',
    cleared: true 
  });
  
  // Clear NextAuth cookies
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.csrf-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  response.cookies.delete('__Host-next-auth.csrf-token');
  
  return response;
}

