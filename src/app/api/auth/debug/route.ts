import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    },
    session: {
      exists: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userIsAdmin: session?.user?.isAdmin,
    },
    cookies: {
      // Note: We can't read HttpOnly cookies from the server in this way
      // This is just for debugging the environment
      note: 'HttpOnly cookies are not accessible via JavaScript',
    },
    recommendations: {
      checkNEXTAUTH_URL: process.env.NEXTAUTH_URL 
        ? `✅ NEXTAUTH_URL is set to: ${process.env.NEXTAUTH_URL}`
        : '❌ NEXTAUTH_URL is NOT set - this will cause issues!',
      checkNEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
        ? `✅ NEXTAUTH_SECRET is set (${process.env.NEXTAUTH_SECRET.length} chars)`
        : '❌ NEXTAUTH_SECRET is NOT set - this will cause issues!',
      checkSecureCookies: process.env.NODE_ENV === 'production'
        ? '✅ Secure cookies enabled (requires HTTPS)'
        : 'ℹ️ Secure cookies disabled (development mode)',
      checkSession: session?.user?.isAdmin
        ? '✅ Session has isAdmin: true'
        : session?.user
        ? '⚠️ Session exists but isAdmin is false or missing'
        : '❌ No session found',
    }
  });
}

