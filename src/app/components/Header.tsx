'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 px-4">
        <p className="text-sm">
          <strong>Important information:</strong> Orders created on or after today will be processed within 3-5 working days. 
          Fast turnaround available!
        </p>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top row with logo, search, and cart */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-3 border border-gray-100">
                <Image
                  src="/images/logo2.jpg"
                  alt="ShirtHappenZ Logo"
                  width={500}
                  height={200}
                  className="h-24 w-auto md:h-26 lg:h-28 transition-all duration-300 group-hover:brightness-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            </Link>

            {/* Search bar - hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-2 text-gray-500 hover:text-purple-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cart and account */}
            <div className="flex items-center space-x-4">
              <Link href="/account" className="hidden md:flex items-center text-gray-700 hover:text-purple-600">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </Link>
              
              <Link href="/cart" className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M9 13h6" />
                </svg>
                £0.00 (0)
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-purple-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Simple Navigation menu */}
          <nav className="hidden md:block border-t border-gray-200">
            <div className="flex items-center space-x-8 py-4">
              <Link href="/" className="text-gray-700 hover:text-purple-600 font-medium">
                Home
              </Link>
              <Link href="/design" className="text-gray-700 hover:text-purple-600 font-medium">
                Online Design
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-purple-600 font-medium">
                Services
              </Link>
              <Link href="/printing" className="text-gray-700 hover:text-purple-600 font-medium">
                Printing
              </Link>
              <Link href="/help" className="text-gray-700 hover:text-purple-600 font-medium">
                Help
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-purple-600 font-medium">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-purple-600 font-medium">
                Contact
              </Link>
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <Link href="/" className="block text-gray-700 hover:text-purple-600 font-medium">Home</Link>
              <Link href="/design" className="block text-gray-700 hover:text-purple-600 font-medium">Design Online</Link>
              <Link href="/services" className="block text-gray-700 hover:text-purple-600 font-medium">Services</Link>
              <Link href="/printing" className="block text-gray-700 hover:text-purple-600 font-medium">Printing</Link>
              <Link href="/help" className="block text-gray-700 hover:text-purple-600 font-medium">Help</Link>
              <Link href="/blog" className="block text-gray-700 hover:text-purple-600 font-medium">Blog</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-purple-600 font-medium">Contact</Link>
              <Link href="/account" className="block text-gray-700 hover:text-purple-600 font-medium">Account</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 