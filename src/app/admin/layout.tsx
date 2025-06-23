import { ReactNode } from 'react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">ShirtHappenz Admin</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Welcome, Admin</span>
              <button className="text-sm text-red-600 hover:text-red-800">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            <Link 
              href="/admin/dashboard"
              className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/products"
              className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
            >
              Products
            </Link>
            <Link 
              href="/admin/orders"
              className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
            >
              Orders
            </Link>
            <Link 
              href="/admin/customers"
              className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg"
            >
              Customers
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 