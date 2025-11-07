import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { securityLogger } from '@/lib/security-audit';

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

  // Enhanced security checks
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /wget/i,
    /curl/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  if (isSuspicious) {
    securityLogger.logSuspiciousRequest(ip, userAgent, 'Suspicious user agent detected');
    // Could implement additional restrictions here
  }

  // Check for common attack patterns in URL
  const url = request.nextUrl.pathname + request.nextUrl.search;
  const attackPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /javascript:/i, // JavaScript injection
    /union\s+select/i, // SQL injection
    /exec\(/i, // Command injection
  ];
  
  const hasAttackPattern = attackPatterns.some(pattern => pattern.test(url));
  if (hasAttackPattern) {
    securityLogger.logAttackAttempt(ip, 'URL Pattern', `Attack pattern detected in URL: ${url}`);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip auth check for NextAuth callback routes
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return response;
    }
    
    console.log('🔍 [Middleware] Checking admin route:', request.nextUrl.pathname);
    console.log('🔍 [Middleware] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    
    // Skip auth check if no secret is configured (let server-side handle it)
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('⚠️ [Middleware] NEXTAUTH_SECRET not set - skipping middleware auth check');
      return response;
    }
    
    try {
      console.log('🔍 [Middleware] Attempting to get token...');
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      console.log('🔍 [Middleware] Token result:', {
        exists: !!token,
        isAdmin: token?.isAdmin,
        email: token?.email
      });
      
      if (!token) {
        console.log('❌ [Middleware] No token found - redirecting to login');
        // Not logged in, redirect to login page
        const loginUrl = new URL('/auth/login', request.url);
        // Add callback URL so user returns to admin after login
        loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      if (!token.isAdmin) {
        console.log('❌ [Middleware] Token found but user is not admin - redirecting to home');
        // Logged in but not admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      console.log('✅ [Middleware] Admin access granted');
    } catch (error) {
      // If token decoding fails (e.g., JWT decryption error), it means:
      // 1. The cookie has an old token encrypted with a different secret, OR
      // 2. The secret is invalid/too short
      // In this case, clear the cookie and redirect to login
      console.error('❌ [Middleware] Token decryption failed (likely old token or invalid secret):', error instanceof Error ? error.message : error);
      
      // Clear the invalid cookie by setting it to expire
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      
      // Clear the session token cookie
      redirectResponse.cookies.delete('next-auth.session-token');
      redirectResponse.cookies.delete('next-auth.csrf-token');
      
      return redirectResponse;
    }
  }

  // API route protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    // Skip auth check if no secret is configured
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('NEXTAUTH_SECRET not set - API route protection disabled');
      return response;
    }
    
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      if (!token?.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      // If token decoding fails, return 403 but log the error
      console.error('API route auth error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
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