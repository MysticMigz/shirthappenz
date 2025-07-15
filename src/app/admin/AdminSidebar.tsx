'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaHome, FaBox, FaShoppingCart, FaUsers, FaTachometerAlt, FaBoxes, FaBell, FaTruck, FaClipboardList, FaChartLine, FaIndustry, FaShippingFast } from 'react-icons/fa';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/admin/dashboard',
      icon: FaTachometerAlt,
      text: 'Dashboard'
    },
    {
      href: '/admin/analytics',
      icon: FaChartLine,
      text: 'Analytics'
    },
    {
      href: '/admin/reports/tax',
      icon: FaChartLine,
      text: 'Tax Reports'
    },
    {
      href: '/admin/products',
      icon: FaBox,
      text: 'Products'
    },
    {
      href: '/admin/orders',
      icon: FaShoppingCart,
      text: 'Orders'
    },
    {
      href: '/admin/production',
      icon: FaIndustry,
      text: 'Production'
    },
    {
      href: '/admin/shipping',
      icon: FaShippingFast,
      text: 'Shipping'
    },
    {
      href: '/admin/users',
      icon: FaUsers,
      text: 'Users'
    },
    {
      href: '/admin/stock',
      icon: FaBoxes,
      text: 'Stock'
    },
    {
      href: '/admin/alerts',
      icon: FaBell,
      text: 'Alerts'
    },
    {
      href: '/admin/supplies',
      icon: FaTruck,
      text: 'Supplies'
    },
    {
      href: '/admin/supplies/orders',
      icon: FaClipboardList,
      text: 'Supply Orders'
    }
  ];

  return (
    <>
      {/* Admin Header */}
      <header className="fixed top-0 right-0 left-0 bg-[var(--brand-white)] shadow-sm border-b border-[var(--brand-blue)] z-50">
        <div className="px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/images/logo.png"
                  alt="ShirtHappenZ Logo"
                  width={200}
                  height={80}
                  className="h-10 w-auto brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-105"
                  priority
                />
              </Link>
              <div className="h-8 w-px bg-[var(--brand-red)] mx-4" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] text-transparent bg-clip-text">Admin Dashboard</h2>
            </div>
            <div className="flex items-center gap-6">
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

      {/* Sidebar Navigation */}
      <aside className="fixed top-16 left-0 w-64 bg-white shadow-sm border-r border-purple-100 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150 ${pathname === item.href ? 'bg-purple-50' : ''}`}
            >
              <item.icon className="mr-3" />
              {item.text}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
} 