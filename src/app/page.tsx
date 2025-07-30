'use client';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';

import MobilePullToRefresh from '@/components/MobilePullToRefresh';

export default function Home() {
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
        <ProductGrid />
        <FeaturesSection />
        <Footer />
      </div>
    </MobilePullToRefresh>
  );
}
