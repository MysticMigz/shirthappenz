'use client';

import { useState, useEffect } from 'react';
import { FaCookieBite, FaTimes, FaCheck, FaTimes as FaX } from 'react-icons/fa';
import Link from 'next/link';
import { getCookieConsent, setCookieConsent } from '@/lib/cookie-consent';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getCookieConsent();
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent('accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    setCookieConsent('declined');
    setShowConsent(false);
  };

  const handleClose = () => {
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Cookie Icon and Text */}
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              <FaCookieBite className="text-purple-600 text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                We use cookies to enhance your experience
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                We use cookies to improve your browsing experience, analyze site traffic, and personalize content. 
                By continuing to use our site, you consent to our use of cookies. 
                <Link href="/cookies" className="text-purple-600 hover:text-purple-800 underline ml-1">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
            >
              <FaX className="text-xs" />
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center gap-2"
            >
              <FaCheck className="text-xs" />
              Accept All
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close cookie consent"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 