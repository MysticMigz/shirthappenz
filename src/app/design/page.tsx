'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { useCart } from '@/context/CartContext';

interface DesignSideData {
  uploadedImage: string | null;
  imagePosition: { x: number; y: number };
  imageScale: number;
  imageRotation: number;
}

interface DesignData {
  front: DesignSideData;
  back: DesignSideData;
  designName: string;
  description: string;
}

const CATEGORIES = [
  { key: 'tshirts', label: 'T-shirt' },
  { key: 'jerseys', label: 'Jersey' },
  { key: 'tanktops', label: 'Tank Top' },
  { key: 'longsleeve', label: 'Long Sleeve' },
  { key: 'hoodies', label: 'Hoody' },
  { key: 'sweatshirts', label: 'Sweatshirt' },
  { key: 'sweatpants', label: 'Sweatpants' },
  { key: 'accessories', label: 'Accessories' },
];

export default function CustomDesignPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [designData, setDesignData] = useState<DesignData>({
    front: {
      uploadedImage: null,
      imagePosition: { x: 0, y: 0 },
      imageScale: 1,
      imageRotation: 0,
    },
    back: {
      uploadedImage: null,
      imagePosition: { x: 0, y: 0 },
      imageScale: 1,
      imageRotation: 0,
    },
    designName: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('tshirts');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    // Fetch products for the selected category
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?category=${selectedCategory}&limit=100`);
        const data = await res.json();
        setProducts(data.products || []);
        setSelectedProduct(data.products?.[0] || null);
      } catch (err) {
        setProducts([]);
        setSelectedProduct(null);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const customizationFee = 12.50;
  const basePrice = selectedProduct?.basePrice ?? 24.99;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/design', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setDesignData(prev => ({
        ...prev,
        [activeSide]: {
          ...prev[activeSide],
          uploadedImage: data.url
        }
      }));
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleImagePosition = (axis: 'x' | 'y', value: number) => {
    setDesignData(prev => ({
      ...prev,
      [activeSide]: {
        ...prev[activeSide],
        imagePosition: {
          ...prev[activeSide].imagePosition,
          [axis]: value
        }
      }
    }));
  };

  const handleImageScale = (scale: number) => {
    setDesignData(prev => ({
      ...prev,
      [activeSide]: {
        ...prev[activeSide],
        imageScale: Math.max(0.1, Math.min(3, scale))
      }
    }));
  };

  const handleImageRotation = (rotation: number) => {
    setDesignData(prev => ({
      ...prev,
      [activeSide]: {
        ...prev[activeSide],
        imageRotation: rotation
      }
    }));
  };

  const resetDesign = () => {
    setDesignData({
      front: {
        uploadedImage: null,
        imagePosition: { x: 0, y: 0 },
        imageScale: 1,
        imageRotation: 0,
      },
      back: {
        uploadedImage: null,
        imagePosition: { x: 0, y: 0 },
        imageScale: 1,
        imageRotation: 0,
      },
      designName: '',
      description: ''
    });
    setError('');
    setSuccess('');
  };

  const addToCart = async () => {
    if (!designData.front.uploadedImage && !designData.back.uploadedImage) {
      setError('Please upload an image for the front or back');
      return;
    }

    if (!designData.designName.trim()) {
      setError('Please enter a design name');
      return;
    }

    try {
      setLoading(true);
      
      const cartItem = {
        productId: 'custom-design',
        name: `Custom Design: ${designData.designName}`,
        size: selectedSize,
        quantity: quantity,
        price: basePrice + customizationFee,
        image: (designData.front.uploadedImage || designData.back.uploadedImage) ?? '',
        customization: {
          name: designData.designName,
          isCustomized: true,
          customizationCost: customizationFee,
          frontImage: designData.front.uploadedImage || undefined,
          frontPosition: designData.front.imagePosition,
          frontScale: designData.front.imageScale,
          frontRotation: designData.front.imageRotation,
          backImage: designData.back.uploadedImage || undefined,
          backPosition: designData.back.imagePosition,
          backScale: designData.back.imageScale,
          backRotation: designData.back.imageRotation
        }
      };

      addItem(cartItem);
      router.push('/cart');
    } catch (error) {
      setError('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`px-4 py-2 rounded-lg font-semibold border ${selectedCategory === cat.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Selector: Only show for jerseys */}
          {selectedCategory === 'jerseys' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2 text-center">Choose a Jersey</h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {products.map(product => (
                  <div
                    key={product._id}
                    className={`border rounded-lg p-2 cursor-pointer w-32 h-48 flex flex-col items-center justify-between ${selectedProduct?._id === product._id ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-200'}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative w-24 h-24 mb-2">
                      <Image
                        src={product.images?.[0]?.url || '/images/no-image.png'}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-xs text-center font-medium text-gray-700 line-clamp-2">{product.name}</div>
                    <div className="text-xs text-gray-500">£{product.basePrice?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side Toggle */}
          <div className="flex justify-center mb-6 gap-4">
            <button
              className={`px-6 py-2 rounded-lg font-semibold border ${activeSide === 'front' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}
              onClick={() => setActiveSide('front')}
            >
              Front
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-semibold border ${activeSide === 'back' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}
              onClick={() => setActiveSide('back')}
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Design Preview Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Design Preview ({activeSide.charAt(0).toUpperCase() + activeSide.slice(1)})
                </h2>
                
                {/* Shirt Template with Design */}
                <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {/* Shirt Template */}
                  <div className="absolute inset-0">
                    <Image
                      src={
                        selectedCategory === 'hoodies'
                          ? (activeSide === 'front'
                              ? '/images/hoody-front.png'
                              : '/images/hoody-back.png')
                          : selectedCategory === 'tshirts'
                            ? (activeSide === 'front'
                                ? '/images/front-tshirt.png'
                                : '/images/back-tshirt.png')
                            : selectedCategory === 'jerseys'
                              ? (activeSide === 'front'
                                  ? '/images/jersey-front.png'
                                  : '/images/jersey-back.png')
                              : selectedProduct?.images?.[0]?.url || '/images/front-tshirt.png'
                      }
                      alt="Shirt template"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  
                  {/* Uploaded Design Overlay */}
                  {designData[activeSide].uploadedImage && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `translate(${designData[activeSide].imagePosition.x}px, ${designData[activeSide].imagePosition.y}px) scale(${designData[activeSide].imageScale}) rotate(${designData[activeSide].imageRotation}deg)`
                      }}
                    >
                      <Image
                        src={designData[activeSide].uploadedImage!}
                        alt="Custom design"
                        width={200}
                        height={200}
                        className="object-contain max-w-[200px] max-h-[200px]"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Upload Prompt */}
                  {!designData[activeSide].uploadedImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-medium">Upload your design</p>
                        <p className="text-sm">Click below to upload an image</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </div>
            </div>

            {/* Design Controls Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Design Controls ({activeSide.charAt(0).toUpperCase() + activeSide.slice(1)})
                </h2>

                {/* Image Position Controls */}
                {designData[activeSide].uploadedImage && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Position & Size</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horizontal Position
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={designData[activeSide].imagePosition.x}
                          onChange={(e) => handleImagePosition('x', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {designData[activeSide].imagePosition.x}px
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vertical Position
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={designData[activeSide].imagePosition.y}
                          onChange={(e) => handleImagePosition('y', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {designData[activeSide].imagePosition.y}px
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scale
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={designData[activeSide].imageScale}
                          onChange={(e) => handleImageScale(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {designData[activeSide].imageScale.toFixed(1)}x
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rotation
                        </label>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={designData[activeSide].imageRotation}
                          onChange={(e) => handleImageRotation(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {designData[activeSide].imageRotation}°
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetDesign}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Reset Design
                    </button>
                  </div>
                )}

                {/* Design Information */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Design Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design Name *
                    </label>
                    <input
                      type="text"
                      value={designData.designName}
                      onChange={(e) => setDesignData(prev => ({ ...prev, designName: e.target.value }))}
                      placeholder="Enter a name for your design"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={designData.description}
                      onChange={(e) => setDesignData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your design..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Product Options */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Product Options</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5].map(qty => (
                          <option key={qty} value={qty}>{qty}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing</h3>
                                      <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>£{basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custom Design Fee:</span>
                        <span>£{customizationFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>£{(basePrice + customizationFee).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  disabled={loading || !designData.front.uploadedImage || !designData.back.uploadedImage || !designData.designName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
} 