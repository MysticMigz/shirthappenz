'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const [productsEnabled, setProductsEnabled] = useState<boolean | null>(null); // null = checking

  // Check if products are enabled
  useEffect(() => {
    const checkProductsEnabled = async () => {
      try {
        const response = await fetch('/api/site-settings?key=productsEnabled');
        if (response.ok) {
          const data = await response.json();
          setProductsEnabled(data.value !== false); // Default to true if not set
        } else {
          setProductsEnabled(true); // Default to enabled on error
        }
      } catch (error) {
        console.error('Error checking products enabled status:', error);
        // Default to enabled on error
        setProductsEnabled(true);
      }
    };

    checkProductsEnabled();
  }, []);
  return (
    <footer className="bg-[var(--brand-blue)] text-[var(--brand-white)]">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png"
                alt="Mr SHIRT PERSONALISATION Logo"
                width={320}
                height={120}
                className="h-24 w-auto brightness-110"
              />
            </Link>
            <p className="text-[var(--brand-white)] mb-4">
              Your one-stop shop for custom apparel printing.
              DTF & Sublimation services for brand owners, individuals, and businesses.
            </p>
            <div className="space-y-2 text-sm text-blue-100">
              <div className="pt-2">
                <p>Phone: 07902870824</p>
                <p>Email: customer.service@mrshirtpersonalisation.com</p>
                <p>Instagram: <a href="https://www.instagram.com/mr_shirt_personalisation" target="_blank" rel="noopener noreferrer" className="text-blue-100 hover:text-[var(--brand-red)] transition-colors">@mr_shirt_personalisation</a></p>
              </div>
            </div>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@mrshirtpersonalisation?_r=1&_t=ZN-91HZztSQGjD" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/mr_shirt_personalisation" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Useful Links</h3>
            <ul className="space-y-2 text-sm">
              {productsEnabled === true && (
                <>
                  <li>
                    <Link href="/products/tshirts" className="text-gray-300 hover:text-purple-400 transition-colors">
                      Personalised T-Shirts
                    </Link>
                  </li>
                  <li>
                    <Link href="/products/workwear" className="text-gray-300 hover:text-purple-400 transition-colors">
                      Personalised Workwear
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/custom-orders" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/our-work" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Our Work
                </Link>
              </li>
              <li>
                <Link href="/accessories/swing-tags" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Personalised Swing Tags
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
                          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help/quick-tips" className="text-gray-300 hover:text-purple-400 transition-colors">
                    Quick Tips
                  </Link>
                </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-purple-400 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/help/video-guide" className="text-gray-300 hover:text-purple-400 transition-colors">
                  T-shirt Design Video Guide
                </Link>
              </li>
              <li>
                <Link href="/help/choosing-tshirt" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Choosing the Best T-Shirt
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Remove Services section and all printing-related links */}
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-blue-100 mb-4 md:mb-0">
              <div>© MR SHIRT PERSONALISATION 2025. All rights reserved.</div>
              <div className="mt-1 text-xs">
                Email: customer.service@mrshirtpersonalisation.com | 
                Phone: 07902870824
              </div>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-blue-100 hover:text-[var(--brand-red)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-blue-100 hover:text-[var(--brand-red)] transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-blue-100 hover:text-[var(--brand-red)] transition-colors">
                Cookie Policy
              </Link>
              <Link href="/faq" className="text-blue-100 hover:text-[var(--brand-red)] transition-colors">
                FAQs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 