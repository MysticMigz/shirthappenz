import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/backend/utils/database';
import User from '@/backend/models/User';
import AccountLockout from '@/backend/models/AccountLockout';
import { securityLogger } from '@/lib/security-audit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        await connectToDatabase();
        
        const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'];
        const email = credentials.email.toLowerCase().trim();
        
        // Check for account lockout
        let lockout = await AccountLockout.findOne({ email, ip: ip as string });
        if (!lockout) {
          lockout = new AccountLockout({ email, ip: ip as string });
        }
        
        if (lockout.isLocked()) {
          securityLogger.logFailedLogin(ip as string, email, userAgent as string);
          throw new Error('Account is temporarily locked due to too many failed attempts. Please try again later.');
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
          // Log failed login attempt and increment lockout
          securityLogger.logFailedLogin(ip as string, email, userAgent as string);
          lockout.incrementFailedAttempts();
          await lockout.save();
          throw new Error('Invalid email or password');
        }
        
        const isValid = await user.comparePassword(credentials.password);
        
        if (!isValid) {
          // Log failed login attempt and increment lockout
          securityLogger.logFailedLogin(ip as string, email, userAgent as string);
          lockout.incrementFailedAttempts();
          await lockout.save();
          throw new Error('Invalid email or password');
        }

        // Reset failed attempts on successful login
        lockout.resetFailedAttempts();
        await lockout.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enhanced security settings
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Security headers
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 