'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  images: Array<{ url: string; alt: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  featured: boolean;
  customizable: boolean;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        // Only set featured products
        setProducts(data.products.filter((p: Product) => p.featured));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (description.length <= maxLength) return description;
    return `${description.substring(0, maxLength).trim()}...`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Design your own printed t-shirt online
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We have taken the best products from our catalogue and created a facility where you can 
            personalise your printed t-shirts and order them instantly online. These products can be 
            produced quickly, often within a 3-5 working day turnaround.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => {
            const hasDiscount = product.basePrice > product.price;
            const discountPercent = hasDiscount ? Math.round(((product.basePrice - product.price) / product.basePrice) * 100) : 0;
            return (
              <Link
                href={`/product/${product._id}`}
                key={product._id}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden h-full relative">
                  {/* Discount Badge at top right */}
                  {product.basePrice > product.price && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-white text-red-600 text-2xl font-extrabold px-4 py-2 rounded-lg shadow-lg border-2 border-red-500">
                        -{Math.round(((product.basePrice - product.price) / product.basePrice) * 100)}%
                      </span>
                    </div>
                  )}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
                          ShirtHappenZ
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {product.category}
                    </p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {truncateDescription(product.description)}
                    </p>
                    
                    {/* Color options */}
                    <div className="flex items-center mb-3">
                      <span className="text-xs text-gray-500 mr-2">Colors:</span>
                      <div className="flex space-x-1">
                        {product.colors.slice(0, 5).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.hexCode }}
                            title={color.name}
                          />
                        ))}
                        {product.colors.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{product.colors.length - 5}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {product.basePrice > product.price ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-xs text-red-600 line-through tracking-tight">RRP: £{product.basePrice.toFixed(2)}</span>
                          <span className="text-xl font-bold text-green-700 leading-tight">£{product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-purple-600">
                          £{product.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-sm text-purple-600 group-hover:translate-x-1 transition-transform duration-200 group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ProductGrid; 