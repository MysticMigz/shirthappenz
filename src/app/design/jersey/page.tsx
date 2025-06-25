'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
}

export default function JerseyLetteringPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [jerseys, setJerseys] = useState<Product[]>([]);
  const [selectedJersey, setSelectedJersey] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Customization options
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const fetchJerseys = async () => {
      try {
        const response = await fetch('/api/products?category=jerseys');
        if (!response.ok) throw new Error('Failed to fetch jerseys');
        const data = await response.json();
        setJerseys(data.products);
        if (data.products.length > 0) {
          setSelectedJersey(data.products[0]);
          if (data.products[0].sizes.length > 0) {
            setSelectedSize(data.products[0].sizes[0]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jerseys');
      } finally {
        setLoading(false);
      }
    };

    fetchJerseys();
  }, []);

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
    return selectedJersey?.stock[size] === 0;
  };

  const getStockLevel = (size: string) => {
    const stock = selectedJersey?.stock[size] || 0;
    if (stock === 0) return { message: 'Out of stock', type: 'error' };
    if (stock <= 5) return { message: `Low stock: only ${stock} left`, type: 'warning' };
    return { message: 'In stock', type: 'success' };
  };

  const isValidNameChar = (char: string) => {
    // Allow letters (including accented), dots, and apostrophes
    return /^[A-ZÀ-ÿ.']+$/i.test(char);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    
    // Filter out invalid characters
    const validValue = value
      .split('')
      .filter(isValidNameChar)
      .join('');

    if (value !== validValue) {
      setNameError('Only letters, dots, and apostrophes allowed');
      // Clear error after 3 seconds
      setTimeout(() => setNameError(''), 3000);
    } else if (value.length > 12) {
      setNameError('Maximum 12 characters allowed');
    } else {
      setNameError('');
    }

    setName(validValue.slice(0, 12));
  };

  const validateCustomization = () => {
    if (!name && !number) {
      setError('Please add either a name or number');
      return false;
    }
    if (number && (isNaN(Number(number)) || Number(number) < 0 || Number(number) > 99)) {
      setError('Number must be between 0 and 99');
      return false;
    }
    // Additional name validation
    if (name && !name.split('').every(isValidNameChar)) {
      setError('Name contains invalid characters');
      return false;
    }
    return true;
  };

  // Calculate customization cost
  const calculateCustomizationCost = () => {
    let cost = 0;
    // Add £2 for each letter in the name
    if (name) {
      cost += name.length * 2;
    }
    // Add £2 for each digit in the number
    if (number) {
      cost += number.length * 2;
    }
    return cost;
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!selectedJersey) return 0;
    const basePrice = selectedJersey.basePrice;
    const customizationCost = calculateCustomizationCost();
    return (basePrice + customizationCost) * quantity;
  };

  const addToCart = async () => {
    if (!selectedJersey || !selectedSize) {
      setError('Please select a product and size');
      return;
    }

    if (!validateCustomization()) {
      return;
    }

    try {
      setLoading(true);

      // Calculate the price including per-character customization
      const basePrice = selectedJersey.basePrice;
      const customizationCost = calculateCustomizationCost();
      const totalPrice = basePrice + customizationCost;

      // Prepare customization details
      const customization = (name || number) ? {
        name: name.trim(),
        number: number.trim(),
        isCustomized: true,
        nameCharacters: name.length,
        numberCharacters: number.length,
        customizationCost: customizationCost
      } : undefined;

      const cartItem = {
        productId: selectedJersey._id,
        name: selectedJersey.name,
        size: selectedSize,
        quantity: quantity,
        price: totalPrice,
        image: selectedJersey.images[0]?.url,
        customization
      };

      addItem(cartItem);
      router.push('/cart');
    } catch (error) {
      setError('Failed to add item to cart');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Jersey Lettering & Numbers</h1>
            <p className="mt-2 text-lg text-gray-600">
              Customize your jersey with your name and number. Perfect for teams and fans!
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Item added to cart successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Jersey Selection */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Jersey</h2>
                <div className="grid grid-cols-2 gap-4">
                  {jerseys.map((jersey) => (
                    <div
                      key={jersey._id}
                      onClick={() => {
                        setSelectedJersey(jersey);
                        if (jersey.sizes.length > 0) {
                          setSelectedSize(jersey.sizes[0]);
                        }
                      }}
                      className={`cursor-pointer rounded-lg border-2 p-4 ${
                        selectedJersey?._id === jersey._id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="relative aspect-square mb-2">
                        {jersey.images[0] ? (
                          <Image
                            src={jersey.images[0].url}
                            alt={jersey.images[0].alt || jersey.name}
                            fill
                            className="object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{jersey.name}</h3>
                      <p className="text-sm text-gray-500">£{jersey.basePrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              {selectedJersey && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Size</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedJersey.sizes.map((size) => {
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
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Customize Your Jersey</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name on Jersey</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        maxLength={12}
                        className={`block w-full rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                          nameError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter name (max 12 chars)"
                      />
                      <div className="mt-1 flex justify-between">
                        <span className={`text-xs ${nameError ? 'text-red-600' : 'text-gray-500'}`}>
                          {nameError || `${name.length}/12 characters`}
                        </span>
                        <span className="text-xs text-gray-500">
                          Letters, dots (.), and apostrophes (') only
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number on Jersey (Optional)</label>
                    <div className="mt-1">
                      <input
                        type="number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        min="0"
                        max="99"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Enter number (0-99)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quantity</h2>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Base Price: £{selectedJersey?.basePrice.toFixed(2)}
                </div>
                {(name || number) && (
                  <div className="text-sm text-gray-600">
                    Customization Cost: £{calculateCustomizationCost().toFixed(2)}
                    <div className="text-xs text-gray-500 ml-2">
                      {name && `Name (${name.length} characters × £2)`}
                      {name && number && <br />}
                      {number && `Number (${number.length} digits × £2)`}
                    </div>
                  </div>
                )}
                <div className="text-xl font-bold text-purple-600 border-t pt-2 mt-2">
                  Total: £{calculateTotal().toFixed(2)}
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={addToCart}
                disabled={loading || !selectedJersey || !selectedSize}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  loading || !selectedJersey || !selectedSize ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 