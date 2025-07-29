import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import { apiRateLimiter } from '@/lib/rate-limit';
import { securityLogger } from '@/lib/security-audit';

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

    if (!session?.user?.email) {
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Return user data (excluding sensitive information)
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.isAdmin
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
} 