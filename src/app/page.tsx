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
        
        {/* Simple test content to ensure rendering works */}
        <div className="bg-red-500 text-white p-4 text-center">
          <h1 className="text-2xl font-bold">TEST - If you see this, the page is rendering</h1>
        </div>
        
        <HeroSection />
        <ProductGrid />
        <FeaturesSection />
        <Footer />
      </div>
    </MobilePullToRefresh>
  );
}
