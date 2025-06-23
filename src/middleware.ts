import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /admin, /admin/products)
  const path = request.nextUrl.pathname;

  // If it's an admin route but not the login page
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = request.cookies.get('adminToken');

    // Redirect to login if there is no token
    if (!token) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('from', path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}; 