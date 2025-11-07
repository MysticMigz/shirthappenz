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

  // Admin route protection - REMOVED
  // Let the server-side admin layout handle authentication instead
  // This is more reliable and avoids cookie/JWT decryption timing issues
  // The server-side getServerSession() handles cookies better than middleware getToken()
  
  // Note: We still protect /api/admin routes below for API security

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
    // Match all routes except static files
    // Admin routes are handled server-side, but middleware still adds security headers
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 