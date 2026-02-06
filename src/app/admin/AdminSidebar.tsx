'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { FaHome, FaBox, FaShoppingCart, FaUsers, FaTachometerAlt, FaBoxes, FaBell, FaTruck, FaClipboardList, FaChartLine, FaIndustry, FaShippingFast, FaTicketAlt, FaEye, FaStore, FaEdit, FaFolder, FaBars, FaTimes } from 'react-icons/fa';
import { FaBarcode } from 'react-icons/fa';
import { useAdminSidebar } from '@/context/AdminSidebarContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed } = useAdminSidebar();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('aside') && !target.closest('button[aria-label="Toggle menu"]')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // Redirect to home after session is cleared
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
      // If signOut fails, still try to navigate away from admin
      window.location.href = '/';
    }
  };

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
      href: '/admin/collections',
      icon: FaFolder,
      text: 'Collections'
    },
    {
      href: '/admin/orders',
      icon: FaShoppingCart,
      text: 'Orders'
    },
    {
      href: '/admin/custom-orders',
      icon: FaEdit,
      text: 'Custom Orders'
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
    },
    {
      href: '/admin/barcodes',
      icon: FaBarcode,
      text: 'Barcodes'
    },
    {
      href: '/admin/vouchers',
      icon: FaTicketAlt,
      text: 'Vouchers'
    },
    {
      href: '/admin/category-visibility',
      icon: FaEye,
      text: 'Category Visibility'
    },
    {
      href: '/admin/front-of-shop',
      icon: FaStore,
      text: 'Front of Shop'
    },
    {
      href: '/admin/site-settings',
      icon: FaTachometerAlt,
      text: 'Site Settings'
    }
  ];

  return (
    <>
      {/* Admin Header */}
      <header className="fixed top-0 right-0 left-0 bg-[var(--brand-white)] shadow-sm border-b border-[var(--brand-blue)] z-50">
        <div className="px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden mr-3 p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="w-6 h-6" />
                ) : (
                  <FaBars className="w-6 h-6" />
                )}
              </button>
              {/* Desktop sidebar toggle button */}
              <button
                onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
                className="hidden md:block mr-3 p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                aria-label="Toggle sidebar"
                aria-expanded={!isDesktopSidebarCollapsed}
              >
                <FaBars className="w-5 h-5" />
              </button>
              <Link href="/" className="flex items-center group">
                <Image
                  src="/images/logo.png"
                  alt="Mr SHIRT PERSONALISATION Logo"
                  width={200}
                  height={80}
                  className="h-10 w-auto brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-105"
                  priority
                />
              </Link>
              <div className="hidden md:block h-8 w-px bg-[var(--brand-red)] mx-4" />
              <h2 className="hidden md:block text-xl font-bold bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] text-transparent bg-clip-text">Admin Dashboard</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <span className="hidden md:block text-sm text-gray-600">Welcome, Admin</span>
              <Link 
                href="/"
                className="text-xs md:text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                View Site
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-xs md:text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Logout"
              >
                {isLoggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-16 left-0 bg-white shadow-sm border-r border-purple-100 h-[calc(100vh-4rem)] overflow-y-auto z-50
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        md:translate-x-0
        ${isDesktopSidebarCollapsed ? 'md:w-16' : 'md:w-64'}
      `}>
        {/* Desktop collapse button inside sidebar */}
        <div className="hidden md:flex justify-end p-2 border-b border-purple-100">
          <button
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-purple-50 rounded-lg transition-colors"
            aria-label={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isDesktopSidebarCollapsed ? (
              <FaBars className="w-4 h-4" />
            ) : (
              <FaTimes className="w-4 h-4" />
            )}
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150
                ${pathname === item.href ? 'bg-purple-50' : ''}
                ${isDesktopSidebarCollapsed ? 'md:justify-center md:px-2' : ''}
                group
              `}
              onClick={() => setIsMobileMenuOpen(false)}
              title={isDesktopSidebarCollapsed ? item.text : undefined}
            >
              <item.icon className={`${isDesktopSidebarCollapsed ? 'md:mr-0' : 'mr-3'} flex-shrink-0`} />
              <span className={`${isDesktopSidebarCollapsed ? 'md:hidden' : ''} whitespace-nowrap`}>
                {item.text}
              </span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
} 