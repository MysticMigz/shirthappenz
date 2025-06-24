'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, setUser } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
              <Image
                src="/images/logo5.png"
                alt="ShirtHappenZ Logo"
                width={600}
                height={240}
                className="h-28 w-auto md:h-32 lg:h-36 brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-110"
                style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                priority
              />
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

            {/* Auth and Cart */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                  >
                    <span className="hidden md:inline-block font-medium">
                      Welcome, {user.firstName}
                    </span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      >
                        My Orders
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link 
                    href="/auth/register" 
                    className="hidden md:inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Register
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="hidden md:inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
              
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

          {/* Navigation menu */}
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
              {user ? (
                <>
                  <div className="text-purple-600 font-medium">Welcome, {user.firstName}!</div>
                  <Link href="/profile" className="block text-gray-700 hover:text-purple-600 font-medium">My Profile</Link>
                  <Link href="/orders" className="block text-gray-700 hover:text-purple-600 font-medium">My Orders</Link>
                  {user.isAdmin && (
                    <Link href="/admin/dashboard" className="block text-gray-700 hover:text-purple-600 font-medium">Admin Dashboard</Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block text-gray-700 hover:text-purple-600 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/register" className="block text-purple-600 hover:text-purple-700 font-medium">Register</Link>
                  <Link href="/auth/login" className="block text-purple-600 hover:text-purple-700 font-medium">Login</Link>
                </>
              )}
              <Link href="/" className="block text-gray-700 hover:text-purple-600 font-medium">Home</Link>
              <Link href="/design" className="block text-gray-700 hover:text-purple-600 font-medium">Design Online</Link>
              <Link href="/services" className="block text-gray-700 hover:text-purple-600 font-medium">Services</Link>
              <Link href="/printing" className="block text-gray-700 hover:text-purple-600 font-medium">Printing</Link>
              <Link href="/help" className="block text-gray-700 hover:text-purple-600 font-medium">Help</Link>
              <Link href="/blog" className="block text-gray-700 hover:text-purple-600 font-medium">Blog</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-purple-600 font-medium">Contact</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 