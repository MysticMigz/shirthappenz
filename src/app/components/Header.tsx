'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, setUser } = useUser();
  const { getTotal, getItemCount } = useCart();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');

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
      <div className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] text-white text-center py-2 px-4">
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
                src="/images/logo.png"
                alt="Mr SHIRT PERSONALISATION Logo"
                width={600}
                height={240}
                className="h-28 w-auto md:h-32 lg:h-36 brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-110"
                style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                priority
              />
            </Link>

            {/* Search bar - hidden on mobile */}
            <div className="hidden md:flex flex-1 justify-center mx-8">
              <div className="p-[2px] rounded-lg bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)]">
                <div className="bg-white rounded-lg flex items-center px-4 py-2">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="bg-transparent outline-none border-none w-80 text-gray-700 placeholder-gray-400"
                  />
                  <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Auth and Cart */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 group border border-black rounded-md px-3 py-1"
                  >
                    <span className="hidden md:inline-block font-medium group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                      Welcome, {user.firstName}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {/* User dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
                      >
                        My Orders
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
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
                    className="hidden md:inline-flex items-center px-4 py-2 border border-black text-black rounded-lg hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition-colors"
                  >
                    Register
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="hidden md:inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
              
              <Link 
                href="/cart" 
                className="group flex items-center bg-white text-black px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="relative">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M9 13h6" />
                  </svg>
                  {getItemCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-200 group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                  £{getTotal().toFixed(2)} ({getItemCount()})
                </span>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
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
              <Link href="/" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Products
              </Link>
              <Link href="/design/jersey" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Design Jersey
              </Link>
              <Link href="/design" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Online Design
              </Link>
              <Link href="/help" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Help
              </Link>
              <Link href="/contact" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Contact
              </Link>
              <Link href="/about" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                About
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
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      router.push(`/products?search=${encodeURIComponent(searchInput)}`);
                    }
                  }}
                />
              </div>
              {user ? (
                <>
                  <div className="text-black font-medium">Welcome, {user.firstName}!</div>
                  <Link href="/profile" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">My Profile</Link>
                  <Link href="/orders" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">My Orders</Link>
                  {user.isAdmin && (
                    <Link href="/admin/dashboard" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Admin Dashboard</Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/register" className="block text-black hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Register</Link>
                  <Link href="/auth/login" className="block text-black hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Login</Link>
                </>
              )}
              <Link href="/" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Home</Link>
              <Link href="/products" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Products</Link>
              <Link href="/design/jersey" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Design Jersey</Link>
              <Link href="/design" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Design Online</Link>
              <Link href="/help" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Help</Link>
              <Link href="/contact" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">Contact</Link>
              <Link href="/about" className="block text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium">About</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 