'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "T-shirt with Full Colour Print",
      subtitle: "for only £12",
      description: "Design Today - Receive it This Week!",
      buttonText: "ORDER NOW",
      buttonLink: "/design",
      bgGradient: "from-purple-600 to-pink-600",
      textColor: "text-white"
    },
    {
      id: 2,
      title: "Custom Hoodies",
      subtitle: "Starting at £20",
      description: "Perfect for any season - Design yours today!",
      buttonText: "ORDER NOW",
      buttonLink: "/design/hoodie",
      bgGradient: "from-blue-600 to-purple-600",
      textColor: "text-white"
    },
    {
      id: 3,
      title: "New - Oversized T-shirts",
      subtitle: "Trendy & Comfortable",
      description: "Available in all sizes and colors",
      buttonText: "ORDER NOW",
      buttonLink: "/design/oversized",
      bgGradient: "from-orange-500 to-red-600",
      textColor: "text-white"
    },
    {
      id: 4,
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
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-96 md:h-[500px] overflow-hidden">
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
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {slide.title}
                </h1>
                <p className="text-2xl md:text-3xl font-semibold mb-2">
                  {slide.subtitle}
                </p>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                  {slide.description}
                </p>
                <div className="space-y-4">
                  <Link
                    href={slide.buttonLink}
                    className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {slide.buttonText}
                  </Link>
                  <p className="text-sm opacity-80">No minimum order</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection; 