'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { useCart } from '@/context/CartContext';
import { saveAs } from 'file-saver';

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

const GENDERS = [
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
  { key: 'unisex', label: 'Unisex' },
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
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('tshirts');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState('men'); // Default to Men
  const [detailsProduct, setDetailsProduct] = useState<any | null>(null);

  useEffect(() => {
    // Fetch products for the selected category
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?category=${selectedCategory}&limit=100`);
        const data = await res.json();
        
        const allProducts = data.products || [];
        const customizableProducts = allProducts.filter((p: any) => p.customizable);
        const firstCustomizable = customizableProducts.find((p: any) => p.gender === selectedGender) || customizableProducts[0] || null;
        
        setProducts(allProducts);
        setSelectedProduct(firstCustomizable);
      } catch (err) {
        setProducts([]);
        setSelectedProduct(null);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedGender]);

  useEffect(() => {
    if (selectedProduct && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0) {
      setSelectedSize(selectedProduct.sizes[0]);
    }
  }, [selectedProduct]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const customizationFee = 12.50;
  const basePrice = selectedProduct?.basePrice ?? 24.99;
  // Normalize stock keys and selectedSize
  const normalizedStock: Record<string, number> = {};
  if (selectedProduct?.stock) {
    Object.keys(selectedProduct.stock).forEach(
      k => normalizedStock[k.trim().toUpperCase()] = selectedProduct.stock[k]
    );
  }
  const normalizedSize = selectedSize.trim().toUpperCase();
  const availableQty = Number(normalizedStock[normalizedSize] ?? 0);
  console.log('selectedSize:', selectedSize, 'normalizedSize:', normalizedSize, 'normalizedStock:', normalizedStock, 'availableQty:', availableQty);

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

    try {
      setLoading(true);
      
      const cartItem = {
        productId: 'custom-design',
        name: 'Custom Design',
        size: selectedSize,
        quantity: quantity,
        price: basePrice + customizationFee,
        image: (designData.front.uploadedImage || designData.back.uploadedImage) ?? '',
        baseProductName: selectedProduct?.name || '',
        baseProductImage: selectedProduct?.images?.[0]?.url || '',
        orderSource: 'online-design',
        customization: {
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

  const exportForDTF = async () => {
    const PRINT_WIDTH = 2480; // A4 at 300 DPI
    const PRINT_HEIGHT = 3508;
    const PREVIEW_ASPECT = 3 / 4; // matches aspect-[3/4] in preview
    // We'll assume the preview area is mapped to the full A4 area

    const side = activeSide;
    const design = designData[side];
    if (!design.uploadedImage) {
      setError('No image uploaded to export.');
      return;
    }

    // Load the image
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = design.uploadedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PRINT_WIDTH;
      canvas.height = PRINT_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Fill white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);

      // Map preview controls to print area
      // Assume preview area is centered, and image is max 200x200px in preview (see <Image width={200} height={200} ... />)
      const previewWidth = 600; // estimate, adjust if you know exact px
      const previewHeight = 800; // estimate, adjust if you know exact px
      const scaleFactor = PRINT_WIDTH / previewWidth;

      // Center of print area
      const centerX = PRINT_WIDTH / 2;
      const centerY = PRINT_HEIGHT / 2;

      // Calculate image position in print area
      const imgPreviewW = 200 * design.imageScale;
      const imgPreviewH = 200 * design.imageScale;
      const imgPrintW = imgPreviewW * scaleFactor;
      const imgPrintH = imgPreviewH * scaleFactor;
      const offsetX = design.imagePosition.x * scaleFactor;
      const offsetY = design.imagePosition.y * scaleFactor;

      ctx.save();
      ctx.translate(centerX + offsetX, centerY + offsetY);
      ctx.rotate((design.imageRotation * Math.PI) / 180);
      ctx.drawImage(img, -imgPrintW / 2, -imgPrintH / 2, imgPrintW, imgPrintH);
      ctx.restore();

      // Export as PNG
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `${designData.designName || 'dtf-design'}-${side}.png`);
        }
      }, 'image/png');
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Gender Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {GENDERS.map(gender => (
              <button
                key={gender.key}
                className={`px-4 py-2 rounded-lg font-semibold border ${selectedGender === gender.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300'}`}
                onClick={() => setSelectedGender(gender.key)}
              >
                {gender.label}
              </button>
            ))}
          </div>
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

          {/* Product Selector: Show for customizable categories */}
          {(selectedCategory === 'jerseys' || selectedCategory === 'tshirts') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2 text-center">
                Choose a {selectedCategory === 'jerseys' ? 'Jersey' : 'T-Shirt'}
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {(() => {
                  const customizableProducts = products.filter((p: any) => p.customizable && p.gender === selectedGender);
                  
                  if (customizableProducts.length === 0) {
                    return <div className="text-gray-500 text-center w-full py-8">No customizable {selectedCategory} available for {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}.</div>;
                  }
                  
                  return customizableProducts.map(product => (
                    <div
                      key={product._id}
                      className={`border rounded-lg p-2 cursor-pointer w-32 h-56 flex flex-col items-center justify-between ${selectedProduct?._id === product._id ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-200'}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative w-24 h-24 mb-2">
                        <Image
                          src={product.images?.[0]?.url || '/images/no-image.png'}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 192px"
                          className="object-contain"
                        />
                      </div>
                      <div className="text-xs text-center font-medium text-gray-700 line-clamp-2">{product.name}</div>
                      <div className="text-xs text-gray-500">£{product.basePrice?.toFixed(2)}</div>
                      <button
                        className="mt-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        type="button"
                        onClick={e => { e.stopPropagation(); setDetailsProduct(product); }}
                      >
                        View Details
                      </button>
                    </div>
                  ));
                })()}
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
                {/* Upload Tip */}
                <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                  <span>Please upload images with transparent backgrounds if you want a more clean design!</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Design Preview ({activeSide.charAt(0).toUpperCase() + activeSide.slice(1)})
                </h2>
                
                {/* Shirt Template with Design */}
                <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {/* Shirt Template */}
                  <div className="absolute inset-0">
                    {(() => {
                      let templateSrc = '';
                      if (selectedCategory === 'hoodies') {
                        templateSrc = activeSide === 'front' ? '/images/hoody-front.png' : '/images/hoody-back.png';
                      } else if (selectedCategory === 'tshirts') {
                        templateSrc = activeSide === 'front' ? '/images/front-tshirt.png' : '/images/back-tshirt.png';
                      } else if (selectedCategory === 'jerseys') {
                        templateSrc = activeSide === 'front' ? '/images/jersey-front.png' : '/images/jersey-back.png';
                      } else {
                        templateSrc = selectedProduct?.images?.[0]?.url || '/images/front-tshirt.png';
                      }
                      
                      return (
                        <Image
                          src={templateSrc}
                          alt={selectedProduct?.name || 'Shirt template'}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain"
                          priority
                        />
                      );
                    })()}
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
                      {/* Remove button */}
                      <button
                        type="button"
                        aria-label="Remove uploaded image"
                        className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-red-500 hover:text-white text-red-600 rounded-full p-1 shadow transition-colors z-10 border border-red-200"
                        onClick={() => setDesignData(prev => ({
                          ...prev,
                          [activeSide]: {
                            uploadedImage: null,
                            imagePosition: { x: 0, y: 0 },
                            imageScale: 1,
                            imageRotation: 0
                          }
                        }))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
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
                  
                  {/* Remove the Design Name and Description fields from the Design Information section */}
                  {/* Remove the designName and description from the designData state and validation */}
                  {/* Update the Add to Cart button to not require designName */}
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
                        onChange={(e) => {
                          const newSize = e.target.value;
                          setSelectedSize(newSize);
                          // Reset quantity to 1 if new size has less stock than current quantity
                          const maxQty = selectedProduct?.stock?.[newSize] || 0;
                          if (quantity > maxQty) setQuantity(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {sizes.filter(size => selectedProduct?.stock?.[size] > 0).map(size => (
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
                        disabled={availableQty === 0}
                      >
                        {availableQty > 0
                          ? Array.from({ length: Math.min(5, availableQty) }, (_, i) => i + 1).map(qty => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))
                          : <option value="">Out of stock</option>
                        }
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
                        <span>£{((basePrice + customizationFee) * quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  disabled={
                    loading ||
                    !selectedProduct ||
                    (!designData.front.uploadedImage && !designData.back.uploadedImage)
                  }
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

      {/* Product Details Modal */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-200">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-fadeIn">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors z-10"
              onClick={() => setDetailsProduct(null)}
              aria-label="Close"
              tabIndex={0}
            >
              ×
            </button>
            <div className="flex flex-col md:flex-row gap-0 md:gap-6 p-6">
              {/* Product Image */}
              <div className="flex-shrink-0 flex items-center justify-center w-full md:w-48 mb-4 md:mb-0">
                <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                  <Image
                    src={detailsProduct.images?.[0]?.url || '/images/no-image.png'}
                    alt={detailsProduct.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center md:text-left">{detailsProduct.name}</h3>
                <div className="text-base text-gray-600 mb-3 text-center md:text-left">{detailsProduct.description}</div>
                <div className="flex flex-wrap items-center gap-2 mb-3 justify-center md:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    £{detailsProduct.basePrice?.toFixed(2)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {detailsProduct.gender?.charAt(0).toUpperCase() + detailsProduct.gender?.slice(1)}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="block text-xs text-gray-500 mb-1 font-medium">Available Sizes:</span>
                  <div className="flex flex-wrap gap-2">
                    {detailsProduct.sizes?.map((size: string, idx: number) => (
                      <span key={idx} className="inline-block px-2 py-1 rounded bg-gray-200 text-xs font-semibold text-gray-700 border border-gray-300">{size}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <span className="block text-xs text-gray-500 mb-1 font-medium">Colors:</span>
                  <div className="flex flex-wrap gap-1 items-center">
                    {detailsProduct.colors?.map((color: any, idx: number) => (
                      <span key={idx} className="inline-block w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: color.hexCode }} title={color.name}></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 