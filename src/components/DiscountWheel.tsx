'use client';

import { useState, useEffect } from 'react';

interface DiscountCode {
  code: string;
  description: string;
  validUntil: string;
  type?: string;
  value?: number;
  minimumOrderAmount?: number;
}

export default function DiscountWheel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch discount codes from API
  useEffect(() => {
    const fetchDiscountCodes = async () => {
      try {
        console.log('Fetching discount codes...');
        const response = await fetch('/api/discount-codes');
        if (response.ok) {
          const data = await response.json();
          console.log('Received discount codes:', data.discountCodes);
          setDiscountCodes(data.discountCodes || []);
        } else {
          console.error('Failed to fetch discount codes:', response.status);
        }
      } catch (error) {
        console.error('Error fetching discount codes:', error);
        // Fallback to empty array if API fails
        setDiscountCodes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountCodes();
  }, []);

  useEffect(() => {
    // Rotate through discount codes every 3 seconds
    if (discountCodes.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % discountCodes.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [discountCodes.length]);

  // Don't show the wheel if loading, no valid discounts, or user closed it
  if (loading || discountCodes.length === 0 || !isVisible) {
    return null;
  }

  const currentDiscount = discountCodes[currentIndex];

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 overflow-hidden relative shadow-lg">
      <div className="w-full relative">
        {/* Scrolling text container - full width */}
        <div className="overflow-hidden">
          <div className="flex items-center space-x-6 animate-scroll">
            {/* Multiple repetitions for seamless looping */}
            {[...Array(4)].map((_, repeatIndex) => (
              <div key={repeatIndex} className="flex items-center space-x-2 flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-yellow-300 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium text-sm whitespace-nowrap">
                  <span className="font-bold text-yellow-300">{currentDiscount.code}</span> - {currentDiscount.description}
                </span>
                <div className="flex space-x-1 flex-shrink-0">
                  {discountCodes.map((_, index) => (
                    <div
                      key={`${repeatIndex}-${index}`}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex ? 'bg-yellow-300' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 transition-colors z-10"
        aria-label="Close discount banner"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
} 