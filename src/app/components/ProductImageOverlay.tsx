'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductImageOverlayProps {
  mockupImage?: { url: string; alt: string };
  designImage?: { 
    url: string; 
    alt: string;
    position?: { x: number; y: number };
    scale?: number;
    rotation?: number;
  };
  fallbackImage?: { url: string; alt: string };
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function ProductImageOverlay({
  mockupImage,
  designImage,
  fallbackImage,
  className = '',
  width = 600,
  height = 600,
  priority = false
}: ProductImageOverlayProps) {
  const [mockupError, setMockupError] = useState(false);
  const [designError, setDesignError] = useState(false);

  // Reset error states when image URLs change
  useEffect(() => {
    if (mockupImage?.url) {
      setMockupError(false);
    }
  }, [mockupImage?.url]);

  useEffect(() => {
    if (designImage?.url) {
      setDesignError(false);
    }
  }, [designImage?.url]);

  // If we have both mockup and design, show overlay
  if (mockupImage && designImage && mockupImage.url && designImage.url) {
    const positionX = designImage.position?.x ?? 0;
    const positionY = designImage.position?.y ?? 0;
    const scale = designImage.scale ?? 100;
    const rotation = designImage.rotation ?? 0;
    
    // Convert percentage to transform values
    const translateX = `${positionX}%`;
    const translateY = `${positionY}%`;
    const scaleValue = scale / 100;
    const rotateValue = `${rotation}deg`;
    
    return (
      <div 
        className={`relative ${className}`} 
        style={{ 
          width: '100%', 
          aspectRatio: '1/1',
          overflow: 'hidden', // Clip content that goes beyond bounds
          position: 'relative'
        }}
      >
        {/* Mockup base image - RENDERED FIRST, NEVER TRANSFORMED, ALWAYS VISIBLE */}
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1, // Higher than default to ensure visibility
            backgroundColor: '#f3f4f6', // Gray background to always show something
            // NO transform property at all - completely static
          }}
        >
          {!mockupError && mockupImage.url ? (
            (mockupImage.url.startsWith('blob:') || mockupImage.url.startsWith('data:')) ? (
              // Use regular img tag for blob/data URLs to avoid Next.js Image issues
              <img
                key={`mockup-${mockupImage.url}`}
                src={mockupImage.url}
                alt={mockupImage.alt || 'Product mockup'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={() => setMockupError(true)}
                onLoad={() => setMockupError(false)}
              />
            ) : (
              <Image
                key={`mockup-${mockupImage.url}`}
                src={mockupImage.url}
                alt={mockupImage.alt || 'Product mockup'}
                fill
                className="object-cover"
                priority={priority}
                onError={() => setMockupError(true)}
                onLoad={() => setMockupError(false)}
                unoptimized={false}
                style={{
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
                Mockup Image
              </div>
            </div>
          )}
        </div>
        {/* Design overlay - SEPARATE LAYER, ONLY THIS GETS TRANSFORMED */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2, // Above mockup but isolated
            pointerEvents: 'none',
            overflow: 'hidden', // Clip scaled design to container bounds
            // Container has no transform - only inner element transforms
          }}
        >
          {/* Only this inner div gets the transform - completely isolated */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              // ONLY transform applied here - affects nothing else
              transform: `translate(calc(-50% + ${translateX}), calc(-50% + ${translateY})) scale(${scaleValue}) rotate(${rotateValue})`,
              transformOrigin: 'center center',
              willChange: 'transform'
            }}
          >
            {!designError && designImage.url ? (
              (designImage.url.startsWith('blob:') || designImage.url.startsWith('data:')) ? (
                // Use regular img tag for blob/data URLs to avoid Next.js Image issues
                <img
                  key={`design-${designImage.url}`}
                  src={designImage.url}
                  alt={designImage.alt || 'Product design'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={() => setDesignError(true)}
                  onLoad={() => setDesignError(false)}
                />
              ) : (
                <Image
                  key={`design-${designImage.url}`}
                  src={designImage.url}
                  alt={designImage.alt || 'Product design'}
                  fill
                  className="object-contain"
                  priority={priority}
                  onError={() => setDesignError(true)}
                  onLoad={() => setDesignError(false)}
                  unoptimized={false}
                  style={{
                    objectFit: 'contain'
                  }}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-50">
                <span className="text-xs text-gray-400">Design image failed to load</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we only have mockup
  if (mockupImage && mockupImage.url) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f3f4f6' }}>
        {!mockupError ? (
          <Image
            src={mockupImage.url}
            alt={mockupImage.alt || 'Product mockup'}
            fill
            className="object-cover"
            priority={priority}
            onError={() => setMockupError(true)}
            unoptimized={mockupImage.url ? (mockupImage.url.startsWith('blob:') || mockupImage.url.startsWith('data:')) : false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
              Mockup Image
            </div>
          </div>
        )}
      </div>
    );
  }

  // If we only have design
  if (designImage && designImage.url) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f3f4f6' }}>
        {!designError ? (
          <Image
            src={designImage.url}
            alt={designImage.alt || 'Product design'}
            fill
            className="object-cover"
            priority={priority}
            onError={() => setDesignError(true)}
            unoptimized={designImage.url ? (designImage.url.startsWith('blob:') || designImage.url.startsWith('data:')) : false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
              Design Image
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to provided image or default placeholder
  if (fallbackImage && fallbackImage.url) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', aspectRatio: '1/1' }}>
        <Image
          src={fallbackImage.url}
          alt={fallbackImage.alt || 'Product'}
          fill
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }

  // Default placeholder
  return (
    <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`} style={{ width: '100%', aspectRatio: '1/1' }}>
      <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
        MR SHIRT PERSONALISATION LTD
      </div>
    </div>
  );
}

