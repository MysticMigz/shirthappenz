import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome, FaBox, FaShoppingCart, FaUsers, FaTachometerAlt, FaBoxes, FaBell } from 'react-icons/fa';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Admin Header */}
      <header className="bg-white shadow-md border-b border-purple-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group mr-4">
                <Image
                  src="/images/logo5.png"
                  alt="ShirtHappenZ Logo"
                  width={200}
                  height={80}
                  className="h-12 w-auto brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-105"
                  priority
                />
              </Link>
              <div className="h-8 w-px bg-purple-200 mx-4" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">Admin Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <Link 
                href="/"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                View Site
              </Link>
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] border-r border-purple-100">
          <nav className="p-4 space-y-1">
            <Link 
              href="/admin/dashboard"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaTachometerAlt className="mr-3" />
              Dashboard
            </Link>
            <Link 
              href="/admin/products"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaBox className="mr-3" />
              Products
            </Link>
            <Link 
              href="/admin/stock"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaBoxes className="mr-3" />
              Stock Management
            </Link>
            <Link 
              href="/admin/alerts"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaBell className="mr-3" />
              Stock Alerts
            </Link>
            <Link 
              href="/admin/orders"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaShoppingCart className="mr-3" />
              Orders
            </Link>
            <Link 
              href="/admin/users"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <FaUsers className="mr-3" />
              Users
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 