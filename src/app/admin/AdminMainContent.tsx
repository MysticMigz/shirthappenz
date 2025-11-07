'use client';

import { ReactNode } from 'react';
import { useAdminSidebar } from '@/context/AdminSidebarContext';

export default function AdminMainContent({ children }: { children: ReactNode }) {
  const { isDesktopSidebarCollapsed } = useAdminSidebar();
  
  return (
    <div className={`md:transition-all md:duration-300 ${isDesktopSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
      <div className="min-h-screen pt-16">
        <div className="p-4 md:p-6">
          <div className="bg-white rounded-lg shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

