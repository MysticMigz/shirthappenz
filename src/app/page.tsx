'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';

import MobilePullToRefresh from '@/components/MobilePullToRefresh';

export default function Home() {
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

  const handleRefresh = async () => {
    // Simulate refresh - in real app, this would reload data
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  return (
    <MobilePullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-white">
        <Header />
        
        <HeroSection />
        {productsEnabled === true && <ProductGrid />}
        <FeaturesSection />
        <Footer />
      </div>
    </MobilePullToRefresh>
  );
}
