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
  { key: 'shortsleeve', label: 'Short Sleeve' },
  { key: 'hoodies', label: 'Hoody' },
  { key: 'sweatshirts', label: 'Sweatshirt' },
  { key: 'sweatpants', label: 'Sweatpants' },
  { key: 'accessories', label: 'Accessories' },
];

const GENDERS = [
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
  { key: 'unisex', label: 'Unisex' },
  { key: 'kids', label: 'Kids' },
];

// Utility to normalize dashes in size labels
function normalizeSizeLabel(label: string) {
  return label.replace(/-/g, '–');
}

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
  const [selectedPaperSize, setSelectedPaperSize] = useState<'A4' | 'A3'>('A4');

  useEffect(() => {
    // Fetch products for the selected category and gender
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?category=${selectedCategory}&gender=${selectedGender}&limit=100`);
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

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (selectedProduct && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0) {
      setSelectedSize(selectedProduct.sizes[0]);
    }
  }, [selectedProduct]);

  // Kids sizes for dropdown
  const KIDS_SIZES = ['0–3M', '3–6M', '6–12M', '1–2Y', '2–3Y', '3–4Y', '5–6Y', '7–8Y', '9–10Y', '11–12Y', '13–14Y'];
  const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const paperSizeFee = selectedPaperSize === 'A3' ? 10.00 : 6.00;
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

    // Validate file type for DTF printing
    const allowedTypes = [
      'image/png',           // PNG with transparent background
      'image/svg+xml',       // SVG vector format
      'application/pdf',     // PDF high-res
      'image/jpeg',          // JPEG (fallback)
      'image/jpg'            // JPG (fallback)
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG (with transparent background), SVG, PDF, or JPEG image for best DTF printing results');
      return;
    }

    // Validate file size (10MB max for vector files)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
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
        price: basePrice + paperSizeFee,
        image: (designData.front.uploadedImage || designData.back.uploadedImage) ?? '',
        baseProductName: selectedProduct?.name || '',
        baseProductImage: selectedProduct?.images?.[0]?.url || '',
        orderSource: 'online-design',
        paperSize: selectedPaperSize,
                  customization: {
            isCustomized: true,
            designFee: paperSizeFee,
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
      
      // Reset form
      resetDesign();
      setQuantity(1);
      
      // Show success message
      setSuccess('Design added to cart successfully! You can continue adding more designs or view your cart.');
      
      // Clear any existing errors
      setError('');
      
    } catch (error) {
      setError('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  // Paper size constants (300 DPI)
  const PAPER_SIZES = {
    A4: { width: 2480, height: 3508 }, // 210mm x 297mm at 300 DPI
    A3: { width: 3508, height: 4961 }  // 297mm x 420mm at 300 DPI
  };

  const exportForDTF = async () => {
    const selectedSize = PAPER_SIZES[selectedPaperSize];
    const PRINT_WIDTH = selectedSize.width;
    const PRINT_HEIGHT = selectedSize.height;
    const PREVIEW_ASPECT = 3 / 4; // matches aspect-[3/4] in preview

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
      // Preview area dimensions (estimated from the template)
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

      // Export as PNG with high quality for DTF
      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `dtf-design-${selectedPaperSize}-${side}-300dpi.png`);
        }
      }, 'image/png', 1.0); // Maximum quality
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Gender Selector */}
          <div className="flex flex-wrap gap-6 justify-center mb-4">
            {GENDERS.map(gender => (
              <button
                key={gender.key}
                className={`px-8 py-2 rounded-full font-semibold border border-black bg-white text-black transition-all duration-300 ease-in-out
                  focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                  ${selectedGender === gender.key ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                  group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
                }
                style={selectedGender === gender.key ? { boxShadow: '0 2px 0 0 var(--brand-red)' } : {}}
                onClick={() => setSelectedGender(gender.key)}
                tabIndex={0}
              >
                <span className="transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">{gender.label}</span>
              </button>
            ))}
          </div>
          {/* Category Selector */}
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`px-8 py-2 rounded-full font-semibold border border-black bg-white text-black transition-all duration-300 ease-in-out
                  focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                  ${selectedCategory === cat.key ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                  group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
                }
                style={selectedCategory === cat.key ? { boxShadow: '0 2px 0 0 var(--brand-red)' } : {}}
                onClick={() => setSelectedCategory(cat.key)}
                tabIndex={0}
              >
                <span className="transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Product Selector: Show for customizable categories */}
          {(selectedCategory === 'jerseys' || selectedCategory === 'tshirts' || selectedCategory === 'tanktops') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2 text-center">
                Choose a {selectedCategory === 'jerseys' ? 'Jersey' : selectedCategory === 'tanktops' ? 'Tank Top' : 'T-Shirt'}
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {(() => {
                  const customizableProducts = products.filter((p: any) => p.customizable && p.gender === selectedGender && p.category === selectedCategory);
                  
                  if (customizableProducts.length === 0) {
                    const categoryName = selectedCategory === 'jerseys' ? 'Jerseys' : selectedCategory === 'tanktops' ? 'Tank Tops' : 'T-Shirts';
                    return <div className="text-gray-500 text-center w-full py-8">No customizable {categoryName} available for {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}.</div>;
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
                        className="mt-1 px-2 py-1 text-xs border border-black bg-white text-black rounded group hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition"
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
          <div className="flex justify-center mb-6 gap-6">
            <button
              className={`px-8 py-2 rounded-full font-semibold border border-black bg-white text-black transition-all duration-300 ease-in-out
                focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                ${activeSide === 'front' ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
              }
              style={activeSide === 'front' ? { boxShadow: '0 2px 0 0 var(--brand-red)' } : {}}
              onClick={() => setActiveSide('front')}
              tabIndex={0}
            >
              <span className="transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">Front</span>
            </button>
            <button
              className={`px-8 py-2 rounded-full font-semibold border border-black bg-white text-black transition-all duration-300 ease-in-out
                focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                ${activeSide === 'back' ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
              }
              style={activeSide === 'back' ? { boxShadow: '0 2px 0 0 var(--brand-red)' } : {}}
              onClick={() => setActiveSide('back')}
              tabIndex={0}
            >
              <span className="transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Design Preview Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Upload Tips */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                    <span>Please upload images with transparent backgrounds if you want a more clean design!</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Your design will be accurately scaled for {selectedPaperSize} printing. A3 provides 40% more print area than A4.</span>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Design Preview ({activeSide.charAt(0).toUpperCase() + activeSide.slice(1)})
                </h2>
                
                {/* Paper Size Indicator */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">
                        Export Size: {selectedPaperSize} ({selectedPaperSize === 'A4' ? '210mm × 297mm' : '297mm × 420mm'})
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">
                      {selectedPaperSize === 'A3' ? 'Larger print area' : 'Standard print area'}
                    </div>
                  </div>
                </div>
                
                {/* Shirt Template with Design */}
                <div className={`relative w-full ${selectedCategory === 'tanktops' ? 'aspect-[4/5]' : 'aspect-[3/4]'} bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200`}>
                  {/* Shirt Template */}
                  <div className={`absolute inset-0 ${selectedCategory === 'tanktops' ? (activeSide === 'back' ? 'p-2' : 'p-8') : ''}`}>
                    {(() => {
                      let templateSrc = '';
                      if (selectedCategory === 'hoodies') {
                        templateSrc = activeSide === 'front' ? '/images/hoody-front.png' : '/images/hoody-back.png';
                      } else if (selectedCategory === 'tshirts') {
                        templateSrc = activeSide === 'front' ? '/images/front-tshirt.png' : '/images/back-tshirt.png';
                      } else if (selectedCategory === 'jerseys') {
                        templateSrc = activeSide === 'front' ? '/images/jersey-front.png' : '/images/jersey-back.png';
                      } else if (selectedCategory === 'tanktops') {
                        templateSrc = activeSide === 'front' ? '/images/tank-top-front.png' : '/images/tank-top-back.png';
                      } else {
                        templateSrc = selectedProduct?.images?.[0]?.url || '/images/front-tshirt.png';
                      }
                      
                      return (
                        <Image
                          src={templateSrc}
                          alt={selectedProduct?.name || 'Shirt template'}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={`object-contain ${selectedCategory === 'tanktops' && activeSide === 'back' ? 'scale-125' : ''}`}
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

                {/* File Upload Tips */}
                <div className="mt-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Best File Types for DTF Printing
                  </h3>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div className="flex items-start">
                      <span className="text-yellow-500 mr-2">🔑</span>
                      <span><strong>PNG (with transparent background):</strong> Best choice. Keeps background clean for precise transfers.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-pink-500 mr-2">🧠</span>
                      <span><strong>SVG / EPS / AI:</strong> Vector formats. Great for logos, scalable without quality loss.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>PDF (High-res):</strong> Good if exported from vector or design software.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">📄</span>
                      <span><strong>JPEG:</strong> Acceptable but PNG with transparency is preferred.</span>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.svg,.pdf,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-white text-black hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent disabled:bg-gray-400 font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {uploading ? 'Uploading...' : 'Upload Design File'}
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
                  
                  {/* Paper Size Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paper Size for Export
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPaperSize('A4')}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedPaperSize === 'A4'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">A4</div>
                        <div className="text-xs text-gray-500">210mm × 297mm</div>
                        <div className="text-xs font-medium text-green-600">£12.50</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPaperSize('A3')}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedPaperSize === 'A3'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">A3</div>
                        <div className="text-xs text-gray-500">297mm × 420mm</div>
                        <div className="text-xs font-medium text-green-600">£17.50</div>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select the paper size for DTF (Direct to Film) export. A3 provides more space for larger designs.
                    </p>
                  </div>

                  {/* Export Button */}
                  {/* Removed Export for DTF button and instructions for public users */}
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
                        {(selectedGender === 'kids' ? KIDS_SIZES : ADULT_SIZES)
                          .filter((size) => {
                            // Only show if size is in KIDS_SIZES and has stock > 0 (normalize dashes)
                            const normalized = normalizeSizeLabel(size);
                            const stock = selectedProduct?.stock || {};
                            // Find a matching key in stock (normalize dashes)
                            const stockKey = Object.keys(stock).find(k => normalizeSizeLabel(k) === normalized);
                            return !!stockKey && stock[stockKey] > 0;
                          })
                          .map((size) => (
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
                      <span>Design Fee ({selectedPaperSize}):</span>
                      <span>£{paperSizeFee.toFixed(2)}</span>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>£{((basePrice + paperSizeFee) * quantity).toFixed(2)}</span>
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
                  className={`w-full font-medium py-3 px-6 rounded-lg transition-colors
                    ${loading || !selectedProduct || (!designData.front.uploadedImage && !designData.back.uploadedImage)
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] text-white hover:brightness-110'}
                  `}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">{success}</span>
                </div>
                <button
                  onClick={() => router.push('/cart')}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  View Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Product Details Modal */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-300 scale-100 animate-fadeIn">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative">
              <button
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110"
                onClick={() => setDetailsProduct(null)}
                aria-label="Close"
                tabIndex={0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{detailsProduct.name}</h2>
                  <p className="text-purple-100 text-sm">Premium Quality Apparel</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-4 border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                    <Image
                      src={detailsProduct.images?.[0]?.url || '/images/no-image.png'}
                      alt={detailsProduct.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  
                  {/* Price Badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      £{detailsProduct.basePrice?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{detailsProduct.description}</p>
                  </div>

                  {/* Gender Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {detailsProduct.gender?.charAt(0).toUpperCase() + detailsProduct.gender?.slice(1)}
                    </span>
                  </div>

                  {/* Sizes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Sizes</h4>
                    <div className="flex flex-wrap gap-2">
                      {detailsProduct.sizes?.map((size: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm font-semibold border border-purple-200 shadow-sm">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Colors</h4>
                    <div className="flex flex-wrap gap-3">
                      {detailsProduct.colors?.map((color: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-lg ring-2 ring-gray-200" 
                            style={{ backgroundColor: color.hexCode }}
                            title={color.name}
                          ></div>
                          <span className="text-xs text-gray-600 font-medium">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setDetailsProduct(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setDetailsProduct(null);
                    setSelectedProduct(detailsProduct);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Select This Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
} 