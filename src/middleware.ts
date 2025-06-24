import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      // Not logged in, redirect to login page
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    if (!token.isAdmin) {
      // Logged in but not admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}; 