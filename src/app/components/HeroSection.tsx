'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface CarouselBackground {
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
  buttonColor: string;
  /** Extra px above the CTA (pushes button lower) */
  buttonMarginTop?: number;
  isActive: boolean;
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
  buttonColor: string;
  buttonMarginTop?: number;
  backgroundImage?: string;
}

export type HeroSectionProps = {
  /** When set, uses supplied slides instead of fetching (admin live preview) */
  previewMode?: boolean;
  previewSlides?: CarouselBackground[];
  /** Overrides site setting for button destination label in preview */
  previewProductsEnabled?: boolean;
};

/** Outer padding; inner card is max-width so images aren’t stretched across full viewport */
const HERO_OUTER =
  'w-full px-4 sm:px-6 lg:px-8 pt-4 pb-6 sm:pt-6 sm:pb-8';
const HERO_CARD =
  'max-w-7xl mx-auto rounded-2xl shadow-xl overflow-hidden border border-gray-200/90 bg-gray-900 ring-1 ring-black/5';

/** Taller strip = less vertical crop with object-cover on wide banners */
const HERO_INNER_H =
  'h-[28rem] sm:h-[580px] md:h-[680px] lg:h-[800px]';

const HeroSection = ({
  previewMode = false,
  previewSlides,
  previewProductsEnabled,
}: HeroSectionProps = {}) => {
  console.log('🎨 HeroSection component rendering');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [customBackgrounds, setCustomBackgrounds] = useState<CarouselBackground[]>(
    () => (previewMode && previewSlides ? previewSlides : [])
  );
  const [isLoading, setIsLoading] = useState(!previewMode);
  const [internalProductsEnabled, setInternalProductsEnabled] = useState<boolean>(true);
  const productsEnabled = previewMode
    ? (previewProductsEnabled ?? true)
    : internalProductsEnabled;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  // No default slides - only custom backgrounds with images

  // Check if products are enabled (homepage only)
  useEffect(() => {
    if (previewMode) return;
    const checkProductsEnabled = async () => {
      try {
        const response = await fetch('/api/site-settings?key=productsEnabled');
        if (response.ok) {
          const data = await response.json();
          setInternalProductsEnabled(data.value !== false); // Default to true if not set
        }
      } catch (error) {
        console.error('Error checking products enabled status:', error);
        setInternalProductsEnabled(true);
      }
    };

    checkProductsEnabled();
  }, [previewMode]);

  // Sync preview from admin (parent should pass a new array when draft data changes)
  useEffect(() => {
    if (!previewMode) return;
    setCustomBackgrounds(previewSlides ?? []);
    setIsLoading(false);
  }, [previewMode, previewSlides]);

  // Load custom backgrounds on component mount (homepage only)
  useEffect(() => {
    if (previewMode) return;
    const loadCustomBackgrounds = async () => {
      try {
        console.log('🎨 Fetching carousel backgrounds...');
        const response = await fetch(`/api/carousel-backgrounds?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        console.log('🎨 API response status:', response.status);
        if (response.ok) {
          const backgrounds = await response.json();
          console.log('🎨 Received backgrounds:', backgrounds);
          backgrounds.forEach((bg: any, index: number) => {
            console.log(`🎨 Background ${index} buttonColor:`, bg.buttonColor);
          });
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
  }, [previewMode]);

  // Create slides from custom backgrounds (memoized for performance)
  const slides: Slide[] = useMemo(() => {
    return customBackgrounds
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
        buttonColor: bg.buttonColor,
        buttonMarginTop:
          typeof bg.buttonMarginTop === 'number' && !Number.isNaN(bg.buttonMarginTop)
            ? Math.min(600, Math.max(0, bg.buttonMarginTop))
            : 0,
        backgroundImage: bg.imageUrl
      }));
  }, [customBackgrounds]);

  useEffect(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  // Preload next slide image for smoother transitions
  useEffect(() => {
    if (slides.length > 0) {
      const nextSlideIndex = (currentSlide + 1) % slides.length;
      const nextSlide = slides[nextSlideIndex];
      if (nextSlide?.backgroundImage) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = nextSlide.backgroundImage;
        document.head.appendChild(link);
        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [currentSlide, slides]);

  console.log('🎨 Created slides:', slides.length, slides);
  slides.forEach((slide, index) => {
    console.log(`🎨 Slide ${index} buttonColor:`, slide.buttonColor);
  });

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

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
      <section className={HERO_OUTER} aria-busy="true">
        <div className={HERO_CARD}>
          <div className={`relative ${HERO_INNER_H} overflow-hidden carousel-section`}>
            <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-lg">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show message when no custom slides with images are configured
  if (slides.length === 0) {
    return (
      <section className={HERO_OUTER}>
        <div className={HERO_CARD}>
          <div className={`relative ${HERO_INNER_H} overflow-hidden carousel-section`}>
            <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <div className="text-6xl mb-4">🖼️</div>
                <h2 className="text-2xl font-bold mb-2">Upload Carousel Images</h2>
                <p className="text-lg opacity-90">Upload background images in the admin panel to display your carousel</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={HERO_OUTER}>
      <div className={HERO_CARD}>
        <div
          className={`relative ${HERO_INNER_H} w-full overflow-hidden carousel-section`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
      {slides.map((slide, index) => {
        const isCurrentSlide = index === currentSlide;
        const isNextSlide = index === (currentSlide + 1) % slides.length;
        const isVisible = isCurrentSlide || isNextSlide;
        
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              isCurrentSlide ? 'translate-x-0' : 
              index < currentSlide ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            <div className="w-full h-full relative bg-gray-900">
              {/* Fill card; crop overflow to match carousel aspect ratio */}
              {slide.backgroundImage ? (
                <Image
                  src={slide.backgroundImage}
                  alt={slide.title || 'Carousel background'}
                  fill
                  className="object-cover object-top"
                  priority={isCurrentSlide}
                  loading={isCurrentSlide ? undefined : 'lazy'}
                  style={{ zIndex: 1 }}
                  sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1280px"
                  quality={85}
                  unoptimized={false}
                  onLoadingComplete={() => {
                    if (isCurrentSlide) {
                      console.log('🎨 Background image loaded successfully:', slide.backgroundImage);
                    }
                  }}
                  onError={(e) => {
                    console.log('❌ Background image failed to load:', slide.backgroundImage);
                    console.log('❌ Error details:', e);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
                    MR SHIRT PERSONALISATION LTD
                  </div>
                </div>
              )}
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              {isCurrentSlide && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="container mx-auto px-4 text-center relative z-10">
                    <div className={`max-w-3xl mx-auto ${slide.textColor || 'text-white'}`}>
                      {slide.title?.trim() && (
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                          {slide.title.trim()}
                        </h1>
                      )}
                      {slide.subtitle?.trim() && (
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2">
                          {slide.subtitle.trim()}
                        </p>
                      )}
                      {slide.description?.trim() && (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 px-2">
                          {slide.description.trim()}
                        </p>
                      )}
                      <div
                        className="space-y-2 sm:space-y-4"
                        style={
                          (slide.buttonMarginTop ?? 0) > 0
                            ? { marginTop: slide.buttonMarginTop }
                            : undefined
                        }
                      >
                        <Link
                          href={productsEnabled === true ? (slide.buttonLink || '/products') : '/custom-orders'}
                          className={`inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation carousel-cta-button ${slide.buttonColor || 'bg-white text-gray-900 hover:bg-gray-100'}`}
                        >
                          {productsEnabled === true ? (slide.buttonText?.trim() || 'EXPLORE') : 'CUSTOM ORDERS'}
                        </Link>
                        {(slide.title?.trim() || slide.subtitle?.trim() || slide.description?.trim()) && (
                          <p className="text-xs sm:text-sm opacity-80">No minimum order</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

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
      </div>
    </div>
    </section>
  );
};

export default HeroSection;