'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CarouselBackground {
  id: string;
  slideId: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  bgGradient: string;
  textColor: string;
  order: number;
}

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  bgGradient: string;
  textColor: string;
  backgroundImage?: string;
}

const HeroSection = () => {
  console.log('🎨 HeroSection component rendering');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [customBackgrounds, setCustomBackgrounds] = useState<CarouselBackground[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  // No default slides - only custom backgrounds with images

  // Load custom backgrounds on component mount
  useEffect(() => {
    const loadCustomBackgrounds = async () => {
      try {
        console.log('🎨 Fetching carousel backgrounds...');
        const response = await fetch('/api/carousel-backgrounds');
        console.log('🎨 API response status:', response.status);
        if (response.ok) {
          const backgrounds = await response.json();
          console.log('🎨 Received backgrounds:', backgrounds);
          setCustomBackgrounds(backgrounds);
        } else {
          console.log('🎨 API call failed:', response.status);
        }
      } catch (error) {
        console.error('Error loading custom backgrounds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomBackgrounds();
  }, []);

  // Create slides from custom backgrounds
  const slides: Slide[] = customBackgrounds
    .filter(bg => bg.isActive && bg.imageUrl)
    .sort((a, b) => a.order - b.order)
    .map(bg => ({
      id: bg.slideId,
      title: bg.title,
      subtitle: bg.subtitle,
      description: bg.description,
      buttonText: bg.buttonText,
      buttonLink: bg.buttonLink,
      bgGradient: bg.bgGradient,
      textColor: bg.textColor,
      backgroundImage: bg.imageUrl
    }));

  console.log('🎨 Created slides:', slides.length, slides);

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

  // Show loading state while fetching custom backgrounds
  if (isLoading) {
    return (
      <section className="relative h-80 sm:h-96 md:h-[500px] overflow-hidden carousel-section">
        <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show message when no custom slides with images are configured
  if (slides.length === 0) {
    return (
      <section className="relative h-80 sm:h-96 md:h-[500px] overflow-hidden carousel-section">
        <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-bold mb-2">Upload Carousel Images</h2>
            <p className="text-lg opacity-90">Upload background images in the admin panel to display your carousel</p>
          </div>
        </div>
      </section>
    );
  }

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
          <div className="w-full h-full relative">
            {/* Background Image using Next.js Image component - same as products */}
            {slide.backgroundImage ? (
              <Image
                src={slide.backgroundImage}
                alt={slide.title || 'Carousel background'}
                fill
                className="object-cover"
                priority
                style={{ zIndex: 1 }}
                onLoad={() => console.log('🎨 Background image loaded successfully:', slide.backgroundImage)}
                onError={(e) => {
                  console.log('❌ Background image failed to load:', slide.backgroundImage);
                  console.log('❌ Error details:', e);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
                  ShirtHappenZ
                </div>
              </div>
            )}
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto px-4 text-center relative z-10">
                <div className={`max-w-3xl mx-auto ${slide.textColor || 'text-white'}`}>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                    {slide.title || 'Custom Design'}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2">
                    {slide.subtitle || 'Explore Our Products'}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 px-2">
                    {slide.description || 'Discover our amazing collection'}
                  </p>
                  <div className="space-y-2 sm:space-y-4">
                    <Link
                      href={slide.buttonLink || '/products'}
                      className="inline-block bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation carousel-cta-button"
                    >
                      {slide.buttonText || 'EXPLORE'}
                    </Link>
                    <p className="text-xs sm:text-sm opacity-80">No minimum order</p>
                  </div>
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