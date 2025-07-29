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