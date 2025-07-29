'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const slides = [
    {
      id: 1,
      title: "Jersey Lettering & Numbers",
      subtitle: "from £5 per item",
      description: "Professional Sports Kit Printing - Perfect for Teams!",
      buttonText: "ORDER NOW",
      buttonLink: "/design/jersey",
      bgGradient: "from-blue-500 to-indigo-600",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "T-shirt with Full Colour Print",
      subtitle: "for only £12",
      description: "Design Today - Receive it This Week!",
      buttonText: "ORDER NOW",
      buttonLink: "/design",
      bgGradient: "from-purple-600 to-pink-600",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "Custom Hoodies",
      subtitle: "Starting at £20",
      description: "Perfect for any season - Design yours today!",
      buttonText: "ORDER NOW",
      buttonLink: "/design/hoodie",
      bgGradient: "from-blue-600 to-purple-600",
      textColor: "text-white"
    },
    {
      id: 4,
      title: "New - Oversized T-shirts",
      subtitle: "Trendy & Comfortable",
      description: "Available in all sizes and colors",
      buttonText: "ORDER NOW",
      buttonLink: "/design/oversized",
      bgGradient: "from-orange-500 to-red-600",
      textColor: "text-white"
    },
    {
      id: 5,
      title: "Workwear Bundle",
      subtitle: "All This for only £125",
      description: "Add Work Trousers and Safety Items",
      buttonText: "MORE INFO",
      buttonLink: "/workwear",
      bgGradient: "from-green-600 to-teal-600",
      textColor: "text-white"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 3 seconds
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    // Resume auto-play after 3 seconds
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    // Resume auto-play after 3 seconds
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > 50) {
      if (distanceX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section 
      className="relative h-80 sm:h-96 md:h-[500px] overflow-hidden carousel-section"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div className={`w-full h-full bg-gradient-to-r ${slide.bgGradient} flex items-center justify-center`}>
            <div className="container mx-auto px-4 text-center">
              <div className={`max-w-3xl mx-auto ${slide.textColor}`}>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2">
                  {slide.subtitle}
                </p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 px-2">
                  {slide.description}
                </p>
                <div className="space-y-2 sm:space-y-4">
                  <Link
                    href={slide.buttonLink}
                    className="inline-block bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation carousel-cta-button"
                  >
                    {slide.buttonText}
                  </Link>
                  <p className="text-xs sm:text-sm opacity-80">No minimum order</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows - Mobile optimized */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 sm:p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center carousel-button backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 sm:p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center carousel-button backdrop-blur-sm"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide indicators - Mobile optimized */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation min-w-[16px] min-h-[16px] carousel-indicator ${
              index === currentSlide ? 'bg-white shadow-lg' : 'bg-white bg-opacity-50 hover:bg-opacity-70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;