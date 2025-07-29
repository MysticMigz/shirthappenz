'use client';

import { useState, useRef, useEffect } from 'react';

interface MobilePullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export default function MobilePullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120
}: MobilePullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    const limitedDistance = Math.min(distance, maxPull);
    
    setPullDistance(limitedDistance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      {isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-100 transition-all duration-200"
          style={{ 
            height: `${pullDistance}px`,
            transform: `translateY(${Math.min(pullDistance, maxPull)}px)`
          }}
        >
          <div className="flex items-center space-x-2">
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full border-2 border-gray-300 border-t-purple-600 w-5 h-5" />
                <span className="text-sm text-gray-600">Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm text-gray-600">
                  {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div style={{ transform: `translateY(${isPulling ? pullDistance : 0}px)` }}>
        {children}
      </div>
    </div>
  );
} 