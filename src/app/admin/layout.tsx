import { ReactNode } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/app/admin/AdminSidebar';
import AdminSessionDebugger from '@/components/AdminSessionDebugger';
import { AdminSidebarProvider } from '@/context/AdminSidebarContext';
import AdminMainContent from '@/app/admin/AdminMainContent';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('❌ [AdminLayout] Error getting session:', error);
    // If session check fails (e.g., JWT decryption error), redirect to login
    redirect('/auth/login?error=session_error');
  }

  // Server-side logging
  console.log('🔍 [AdminLayout] Server-side session check');
  console.log('🔍 [AdminLayout] Session exists:', !!session);
  console.log('🔍 [AdminLayout] Session user:', session?.user ? {
    email: session.user.email,
    isAdmin: session.user.isAdmin,
    role: (session.user as any).role
  } : 'No user');

  if (!session?.user?.isAdmin) {
    console.error('❌ [AdminLayout] Access denied - redirecting to login');
    console.error('❌ [AdminLayout] Reason:', !session ? 'No session' : !session.user ? 'No user' : 'Not admin');
    redirect('/auth/login');
  }

  console.log('✅ [AdminLayout] Access granted - rendering admin layout');

  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <AdminSessionDebugger />
        <AdminSidebar />
        <AdminMainContent>{children}</AdminMainContent>
      </div>
    </AdminSidebarProvider>
  );
} 