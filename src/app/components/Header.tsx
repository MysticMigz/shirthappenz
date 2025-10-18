'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';

interface Voucher {
  code: string;
  description: string;
  validUntil: string;
  type?: string;
  value?: number;
  minimumOrderAmount?: number;
}

const Header = () => {
  const { data: session } = useSession();
  const { user, setUser } = useUser();
  const { items } = useCart();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  // Fetch active vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch('/api/discount-codes');
        if (response.ok) {
          const data = await response.json();
          setVouchers(data.discountCodes || []);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    fetchVouchers();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Top announcement bar - now shows voucher information */}
      {vouchers.length > 0 && (
        <div className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] text-white text-center py-2 px-4">
          <p className="text-xs sm:text-sm px-2">
            <strong>Special Offer:</strong> {vouchers.map((voucher, index) => (
              <span key={voucher.code}>
                Use code <strong>{voucher.code}</strong> for {voucher.description}
                {index < vouchers.length - 1 && ' | '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Main header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top row with logo, search, and cart */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/images/logo.png"
                alt="MR SHIRT PERSONALISATION Logo"
                width={600}
                height={240}
                                 className="h-24 w-auto sm:h-28 md:h-32 lg:h-36 brightness-110 transition-transform duration-300 ease-in-out group-hover:scale-110"
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
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        router.push(`/products?search=${encodeURIComponent(searchInput)}`);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (searchInput.trim()) {
                        router.push(`/products?search=${encodeURIComponent(searchInput.trim())}`);
                      }
                    }}
                    className="focus:outline-none"
                  >
                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Auth and Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4">
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
                className="group flex items-center bg-white text-black px-2 sm:px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="relative">
                  <svg className="w-5 h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M9 13h6" />
                  </svg>
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline group-hover:translate-x-1 transition-transform duration-200 group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                  £{items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ({items.reduce((sum, item) => sum + item.quantity, 0)})
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
            <div className="flex items-center justify-center space-x-8 py-4">
              <Link href="/" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Products
              </Link>
              <Link href="/design" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Custom Design
              </Link>
              <Link href="/custom-orders" className="text-gray-700 hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent font-medium transition">
                Custom Orders
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
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-6">
              {/* Search bar for mobile */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (searchInput.trim()) {
                          router.push(`/products?search=${encodeURIComponent(searchInput.trim())}`);
                          setIsMobileMenuOpen(false);
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (searchInput.trim()) {
                        router.push(`/products?search=${encodeURIComponent(searchInput.trim())}`);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* User section */}
              {user ? (
                <div className="space-y-4">
                  <div className="text-black font-semibold text-lg">Welcome, {user.firstName}!</div>
                  <div className="space-y-3">
                    <Link 
                      href="/profile" 
                      className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link 
                      href="/orders" 
                      className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    {user.isAdmin && (
                      <Link 
                        href="/admin/dashboard" 
                        className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link 
                    href="/auth/register" 
                    className="block py-3 px-4 text-black hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="block py-3 px-4 text-black hover:bg-gray-50 rounded-lg font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
              
              {/* Navigation links */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <Link 
                  href="/" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link 
                  href="/design" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Custom Design
                </Link>
                <Link 
                  href="/custom-orders" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Custom Orders
                </Link>
                <Link 
                  href="/help" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Help
                </Link>
                <Link 
                  href="/contact" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link 
                  href="/about" 
                  className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 