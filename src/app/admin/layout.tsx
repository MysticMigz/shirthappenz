import { ReactNode } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/app/admin/AdminSidebar';
import AdminSessionDebugger from '@/components/AdminSessionDebugger';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <AdminSessionDebugger />
      <AdminSidebar />
      {/* Main content */}
      <div className="ml-64">
        <div className="min-h-screen pt-16">
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 