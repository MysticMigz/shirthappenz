import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Security headers for all requests
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add HSTS header for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Rate limiting check (basic implementation)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `rate_limit:${ip}`;
  
  // Check for suspicious patterns
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  if (isSuspicious) {
    // Add extra logging for suspicious requests
    console.log(`Suspicious request from IP: ${ip}, User-Agent: ${userAgent}`);
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      // Not logged in, redirect to login page
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    if (!token.isAdmin) {
      // Logged in but not admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // API route protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const token = await getToken({ req: request });
    
    if (!token?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 