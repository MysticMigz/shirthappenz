import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import { apiRateLimiter } from '@/lib/rate-limit';
import { securityLogger } from '@/lib/security-audit';

// Force dynamic rendering - this route uses headers() and cannot be statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Rate limiting check
    const rateLimitResult = await apiRateLimiter.checkLimit(request as any, 'session');
    if (!rateLimitResult.allowed) {
      const ip = (request as any).ip || (request as any).headers?.get('x-forwarded-for') || 'unknown';
      const userAgent = (request as any).headers?.get('user-agent') || undefined;
      securityLogger.logRateLimitExceeded(ip, 'session', userAgent);
      
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    console.log('🔍 [Session API] getServerSession result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userIsAdmin: session?.user?.isAdmin,
      fullSession: session
    });

    if (!session?.user?.email) {
      console.log('❌ [Session API] No session or user email');
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const user = await (User as any).findOne({ email: session.user.email });

    if (!user) {
      console.log('❌ [Session API] User not found in database');
      return NextResponse.json({ user: null });
    }

    console.log('🔍 [Session API] Database user:', {
      email: user.email,
      isAdmin: user.isAdmin,
      sessionIsAdmin: session.user.isAdmin
    });

    // Use isAdmin from session (JWT token) if available, otherwise fall back to database
    // This ensures we're using the most up-to-date value from the token
    const isAdmin = session.user.isAdmin ?? user.isAdmin;

    // Return user data (excluding sensitive information)
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: isAdmin
    };

    console.log('✅ [Session API] Returning user data:', userData);

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
} 