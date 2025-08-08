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

  // Size sorting function
  const sortSizes = (sizes: string[]) => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    return [...sizes].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
  };

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

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000); // 5 seconds to match main design page
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
    return /^[A-ZÀ-ÿ.\s']+$/i.test(char);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    
    // Filter out invalid characters
    const validValue = value
      .split('')
      .filter(isValidNameChar)
      .join('');

    if (value !== validValue) {
      setNameError('Only letters, spaces, dots, and apostrophes allowed');
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
    if (name && !name.split('').every(isValidNameChar)) {
      setError('Name contains invalid characters');
      return false;
    }
    if (name && name.length > 12) {
      setError('Name must be 12 characters or less');
      return false;
    }
    return true;
  };

  const calculateCustomizationCost = () => {
    let cost = 0;
    if (name) cost += name.replace(/\s/g, '').length * 2; // Ignore spaces in cost calculation
    if (number) cost += number.length * 2;
    return cost;
  };

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
      setAddingToCart(true);
      const basePrice = selectedJersey.basePrice;
      const customizationCost = calculateCustomizationCost();
      const totalPrice = basePrice + customizationCost;

      const customization = (name.trim() || number.trim()) ? {
        name: name.trim() || undefined,
        number: number.trim() || undefined,
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
      
      // Reset form
      setName('');
      setNumber('');
      setQuantity(1);
      setNameError('');
      
      // Show success message
      setShowSuccess(true);
      
      // Clear any existing errors
      setError('');
      
    } catch (error) {
      setError('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Item added to cart successfully! You can continue adding more designs or view your cart.</span>
              </div>
              <button
                onClick={() => router.push('/cart')}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                View Cart
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Jersey Selection and Preview */}
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
                          ? 'border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="relative aspect-square mb-2">
                        {jersey.images[0] ? (
                          <Image
                            src={jersey.images[0].url}
                            alt={jersey.images[0].alt || jersey.name}
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
                      <h3 className="font-medium text-gray-900">{jersey.name}</h3>
                      <p className="text-sm text-gray-500">£{jersey.basePrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jersey Preview */}
              {/* <div className="w-full max-w-md mx-auto">
                <JerseyPreview
                  name={name}
                  number={number}
                  jerseyImage={selectedJersey?.images?.[0]?.url}
                />
              </div> */}
            </div>

            {/* Customization Form */}
            <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Customize Your Jersey</h2>
                
                {/* Name Input */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name on Jersey (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={handleNameChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    maxLength={12}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-600">{nameError}</p>
                  )}
                </div>

                {/* Number Input */}
                <div className="mb-4">
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                    Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value.slice(0, 2))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>

                {/* Size Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {selectedJersey && sortSizes(selectedJersey.sizes).map((size) => {
                      const stockLevel = getStockLevel(size);
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={isOutOfStock(size)}
                          className={`
                            py-2 px-4 text-sm font-medium rounded-md
                            ${selectedSize === size
                              ? 'bg-blue-600 text-white'
                              : isOutOfStock(size)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && (
                    <p className={`mt-2 text-sm ${
                      getStockLevel(selectedSize).type === 'error' ? 'text-red-600' :
                      getStockLevel(selectedSize).type === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getStockLevel(selectedSize).message}
                    </p>
                  )}
                </div>

                {/* Quantity Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center mt-1">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-1 border rounded-l-md bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                      className="w-16 text-center border-t border-b"
                      min="1"
                      max="10"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-1 border rounded-r-md bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Price Breakdown</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>£{selectedJersey?.basePrice.toFixed(2)}</span>
                    </div>
                                         {calculateCustomizationCost() > 0 && (
                       <>
                         <div className="flex justify-between">
                           <span>Customization:</span>
                           <span>£{calculateCustomizationCost().toFixed(2)}</span>
                         </div>
                         <div className="text-xs text-gray-600 ml-4 space-y-1">
                           {name && (
                             <div className="flex justify-between">
                               <span>Name ({name.replace(/\s/g, '').length} chars):</span>
                               <span>£{(name.replace(/\s/g, '').length * 2).toFixed(2)}</span>
                             </div>
                           )}
                           {number && (
                             <div className="flex justify-between">
                               <span>Number ({number.length} chars):</span>
                               <span>£{(number.length * 2).toFixed(2)}</span>
                             </div>
                           )}
                         </div>
                       </>
                     )}
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>x{quantity}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total:</span>
                      <span>£{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  disabled={loading || addingToCart}
                  className={`mt-6 w-full py-3 px-4 rounded-md text-white font-medium ${
                    loading || addingToCart
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {loading || addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 