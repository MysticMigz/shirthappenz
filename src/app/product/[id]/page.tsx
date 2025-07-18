'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { useCart } from '@/context/CartContext';

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
  stock: { [key: string]: number };
  featured: boolean;
  customizable: boolean;
  rrp?: number;
}

// Size order mapping for correct sorting
const SIZE_ORDER: { [key: string]: number } = {
  'XXS': 0,
  'XS': 1,
  'S': 2,
  'M': 3,
  'L': 4,
  'XL': 5,
  'XXL': 6,
  '2XL': 6, // Alternative notation
  'XXXL': 7,
  '3XL': 7, // Alternative notation
  '4XL': 8,
  '5XL': 9,
};

// Helper function to sort sizes
const sortSizes = (sizes: string[]): string[] => {
  return [...sizes].sort((a, b) => {
    const aOrder = SIZE_ORDER[a.toUpperCase()] ?? 999;
    const bOrder = SIZE_ORDER[b.toUpperCase()] ?? 999;
    return aOrder - bOrder;
  });
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        setProduct(data.product);
        // Set first available size as default (using sorted sizes)
        if (data.product.sizes.length > 0) {
          const sortedSizes = sortSizes(data.product.sizes);
          setSelectedSize(sortedSizes[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(10, value));
    setQuantity(newQuantity);
  };

  const isOutOfStock = (size: string) => {
    return product?.stock[size] === 0;
  };

  const getStockLevel = (size: string) => {
    const stock = product?.stock[size] || 0;
    if (stock === 0) return { message: 'Out of stock', type: 'error' };
    if (stock <= 5) return { message: `Low stock: only ${stock} left`, type: 'warning' };
    return { message: 'In stock', type: 'success' };
  };

  const addToCart = async () => {
    if (!product || !selectedSize) return;

    setAddingToCart(true);
    try {
      const cartItem = {
        productId: product._id,
        name: product.name,
        size: selectedSize,
        quantity: quantity,
        price: product.price,
        image: product.images[0]?.url,
        color: product.colors[0]?.name
      };
      
      addItem(cartItem);
      setShowSuccess(true);
      // Reset quantity after adding to cart
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Link href="/" className="text-purple-600 hover:text-purple-800">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-white py-12">
        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to cart!
            <Link href="/cart" className="ml-4 underline hover:text-green-100">
              View Cart
            </Link>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
                    ShirtHappenZ
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-500 mb-4">{product.category}</p>
              {/* RRP and Offer Price */}
              {product.basePrice > product.price ? (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-lg text-gray-400 line-through">RRP: £{product.basePrice.toFixed(2)}</span>
                  <span className="text-2xl font-bold text-green-700">Offer: £{product.price.toFixed(2)}</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-purple-600 mb-6">
                  £{product.price.toFixed(2)}
                </p>
              )}
              <div className="prose prose-sm text-gray-600 mb-6">
                {product.description}
              </div>

              {/* Color Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Colors</h3>
                <div className="flex space-x-2">
                  {product.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-gray-200 cursor-pointer"
                      style={{ backgroundColor: color.hexCode }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Select Size</h3>
                <div className="grid grid-cols-3 gap-2">
                  {product && sortSizes(product.sizes).map((size) => {
                    const stockStatus = getStockLevel(size);
                    return (
                      <div key={size} className="flex flex-col">
                        <button
                          onClick={() => setSelectedSize(size)}
                          disabled={isOutOfStock(size)}
                          className={`
                            py-2 px-4 text-sm font-medium rounded-md border
                            ${selectedSize === size
                              ? 'border-purple-600 bg-purple-50 text-purple-600'
                              : isOutOfStock(size)
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-purple-600 text-gray-900'
                            }
                          `}
                        >
                          {size}
                        </button>
                        {stockStatus.type !== 'success' && (
                          <span className={`
                            text-xs mt-1 text-center
                            ${stockStatus.type === 'error' ? 'text-red-600' : 'text-orange-500'}
                          `}>
                            {stockStatus.message}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedSize && (
                  <div className="mt-3">
                    {(() => {
                      const stockStatus = getStockLevel(selectedSize);
                      return (
                        <div className={`
                          inline-flex items-center px-3 py-1 rounded-full text-sm
                          ${stockStatus.type === 'error' 
                            ? 'bg-red-100 text-red-800' 
                            : stockStatus.type === 'warning'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }
                        `}>
                          <span className="mr-2">
                            {stockStatus.type === 'error' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            {stockStatus.type === 'warning' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            {stockStatus.type === 'success' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          {stockStatus.message}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quantity Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-2 border rounded-md hover:bg-gray-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border rounded-md p-2"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-2 border rounded-md hover:bg-gray-50"
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={!selectedSize || isOutOfStock(selectedSize) || addingToCart}
                className={`
                  w-full py-3 px-4 rounded-md text-white font-medium transition-colors duration-200
                  ${!selectedSize || isOutOfStock(selectedSize) || addingToCart
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] hover:brightness-110'
                  }
                `}
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    Adding to Cart...
                  </span>
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 