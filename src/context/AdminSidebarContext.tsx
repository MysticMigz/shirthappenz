'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminSidebarContextType {
  isDesktopSidebarCollapsed: boolean;
  setIsDesktopSidebarCollapsed: (collapsed: boolean) => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  return (
    <AdminSidebarContext.Provider value={{ isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (context === undefined) {
    throw new Error('useAdminSidebar must be used within an AdminSidebarProvider');
  }
  return context;
}

