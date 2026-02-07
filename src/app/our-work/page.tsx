'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface ShowcaseSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

// Fallback images when no carousel slides are configured (showcase-style placeholders)
const FALLBACK_SLIDES: ShowcaseSlide[] = [
  { id: '1', imageUrl: 'https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png', title: 'Custom apparel', subtitle: 'Quality printing' },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea913ec4?w=1200', title: 'T-shirts & garments', subtitle: 'DTF & sublimation' },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200', title: 'Personalisation', subtitle: 'Your design, your way' },
];

const AUTO_ADVANCE_MS = 5000;

export default function OurWorkPage() {
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/our-work-slides?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const withImages = (data || [])
            .filter((s: any) => s.imageUrl)
            .map((s: any) => ({
              id: String(s.id),
              imageUrl: s.imageUrl,
              title: s.title,
              subtitle: s.subtitle,
            }));
          setSlides(withImages.length > 0 ? withImages : FALLBACK_SLIDES);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch {
        setSlides(FALLBACK_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const goTo = useCallback((index: number) => {
    if (slides.length === 0) return;
    setCurrentIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [slides.length, currentIndex, next]);

  const displaySlides = slides.length > 0 ? slides : FALLBACK_SLIDES;
  const current = displaySlides[currentIndex % displaySlides.length];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900">Our Work</h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              A selection of the custom apparel and personalised printing we&apos;ve created for our customers.
            </p>
          </div>

          {loading ? (
            <div className="aspect-video max-w-5xl mx-auto rounded-2xl bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : (
            <div className="relative max-w-5xl mx-auto">
              {/* Carousel */}
              <div
                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900 shadow-2xl"
                aria-roledescription="carousel"
                aria-label="Showcase of our work"
              >
                {displaySlides.map((slide, index) => {
                  const isActive = index === currentIndex % displaySlides.length;
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                      aria-hidden={!isActive}
                      role="group"
                      aria-label={`Slide ${index + 1} of ${displaySlides.length}`}
                    >
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title || `Showcase ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        priority={index === 0}
                      />
                      {(slide.title || slide.subtitle) && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                          {slide.title && <p className="text-xl font-semibold">{slide.title}</p>}
                          {slide.subtitle && <p className="text-sm opacity-90 mt-1">{slide.subtitle}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Prev / Next */}
                {displaySlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => { prev(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-800 transition-transform hover:scale-105"
                      aria-label="Previous slide"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => { next(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-800 transition-transform hover:scale-105"
                      aria-label="Next slide"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Dots */}
              {displaySlides.length > 1 && (
                <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Slide navigation">
                  {displaySlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goTo(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentIndex % displaySlides.length
                          ? 'bg-purple-600 scale-125'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-selected={index === currentIndex % displaySlides.length}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-12 max-w-3xl mx-auto text-center text-gray-600">
            <p>
              Want something like this? Head to <a href="/custom-orders" className="text-purple-600 font-medium hover:underline">Custom Orders</a> or{' '}
              <a href="/contact" className="text-purple-600 font-medium hover:underline">get in touch</a> and we&apos;ll help bring your idea to life.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
