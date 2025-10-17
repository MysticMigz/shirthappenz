'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUpload, FaTrash, FaLink } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { generateBarcode } from '@/lib/utils';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
// html2canvas will be imported dynamically to avoid SSR issues

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  gender: string;
  images: Array<{ url: string; alt: string; color?: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string; imageUrl?: string; stock?: { [size: string]: number } }>;
  featured: boolean;
  customizable: boolean;
  basePrice: number;
  stock: { [size: string]: number };
  barcode?: string;
  barcodes?: Array<{ colorName: string; colorHex: string; value: string; size: string; sizeCode: string }>;
}

// Dynamically import react-barcode to avoid SSR issues
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

export default function EditProduct({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string; color?: string }>>([]);
  const [urlImages, setUrlImages] = useState<Array<{ url: string; alt: string; color?: string }>>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageColor, setImageColor] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [colorImageUploads, setColorImageUploads] = useState<Record<number, { file: File; preview: string } | null>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    gender: '',
    images: [],
    sizes: [],
    colors: [],
    featured: false,
    customizable: true,
    basePrice: 0,
    stock: {}
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.preview));
      Object.values(colorImageUploads).forEach(imageData => {
        if (imageData) URL.revokeObjectURL(imageData.preview);
      });
    };
  }, [uploadedImages, colorImageUploads]);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        
        const product = await response.json();
        setFormData(product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchProduct();
    }
  }, [session, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleColorChange = (index: number, field: 'name' | 'hexCode' | 'imageUrl', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  const handleColorStockChange = (colorIndex: number, size: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === colorIndex 
          ? { 
              ...color, 
              stock: { 
                ...color.stock, 
                [size]: quantity 
              } 
            } 
          : color
      )
    }));
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#000000', imageUrl: '', stock: {} }]
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleSizeChange = (size: string) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size].sort();

      // Initialize or remove stock for the size
      const newStock = { ...prev.stock };
      if (newSizes.includes(size) && !newStock[size]) {
        newStock[size] = 0;
      } else if (!newSizes.includes(size)) {
        delete newStock[size];
      }

      return {
        ...prev,
        sizes: newSizes,
        stock: newStock
      };
    });
  };

  const handleStockChange = (size: string, value: string) => {
    // Convert to number and handle invalid input
    const quantity = Math.max(0, parseInt(value) || 0);
    
    setFormData(prev => ({
      ...prev,
      stock: {
        ...prev.stock,
        [size]: quantity
      }
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        color: '' // Default to no specific color
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageRemove = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setUploadedImages(prev => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleImageColorChange = (index: number, color: string, type: 'existing' | 'uploaded' | 'url') => {
    if (type === 'existing') {
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index ? { ...img, color } : img
        )
      }));
    } else if (type === 'uploaded') {
      setUploadedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, color } : img
      ));
    } else {
      setUrlImages(prev => prev.map((img, i) => 
        i === index ? { ...img, color } : img
      ));
    }
  };

  const handleUrlImageAdd = () => {
    if (imageUrl.trim() && imageAlt.trim()) {
      setUrlImages(prev => [...prev, { 
        url: imageUrl.trim(), 
        alt: imageAlt.trim(), 
        color: imageColor.trim() 
      }]);
      setImageUrl('');
      setImageAlt('');
      setImageColor('');
      setShowUrlInput(false);
    }
  };

  const handleUrlImageRemove = (index: number) => {
    setUrlImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleColorImageSelect = (colorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setColorImageUploads(prev => ({
        ...prev,
        [colorIndex]: { file, preview }
      }));
    }
  };

  const handleColorImageRemove = (colorIndex: number) => {
    setColorImageUploads(prev => {
      if (prev[colorIndex]) {
        URL.revokeObjectURL(prev[colorIndex]!.preview);
      }
      const newUploads = { ...prev };
      delete newUploads[colorIndex];
      return newUploads;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, upload all new images
      const uploadedImageUrls = await Promise.all(
        uploadedImages.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();
          return {
            url: data.url, // Use Cloudinary URL as-is
            alt: image.file.name,
            color: image.color || undefined
          };
        })
      );

      // Upload color-specific images
      const colorImageUrls = await Promise.all(
        Object.entries(colorImageUploads).map(async ([colorIndex, imageData]) => {
          if (!imageData) return null;
          
          const formData = new FormData();
          formData.append('file', imageData.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload color image');
          }

          const data = await response.json();
          const colorIndexNum = parseInt(colorIndex);
          const colorName = formData.colors[colorIndexNum]?.name;
          
          return {
            url: data.url,
            alt: `${colorName || 'Color'} variant`,
            color: colorName
          };
        })
      );

      // Filter out null values
      const validColorImageUrls = colorImageUrls.filter(Boolean);

      // Combine existing, uploaded, URL, and color-specific images
      const productData = {
        ...formData,
        images: [...formData.images, ...uploadedImageUrls, ...urlImages, ...validColorImageUrls],
        stock: formData.stock,
        price: Number(formData.price),
        basePrice: Number(formData.basePrice),
        category: formData.category ? formData.category.toLowerCase() : '',
        gender: formData.gender ? formData.gender.toLowerCase() : '',
      };

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Barcode export handler
  const barcodeRef = useRef<HTMLDivElement>(null);
  const handleExportBarcode = async () => {
    if (!barcodeRef.current) return;
    try {
      const dataUrl = await toPng(barcodeRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${formData.name || 'barcode'}.png`;
      link.click();
    } catch (err) {
      alert('Failed to export barcode.');
    }
  };

  // Export all barcodes as printable PDF labels
  const handleExportAllBarcodesPDF = async () => {
    if (!formData.barcodes || formData.barcodes.length === 0) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [50, 30] }); // 50x30mm label size
    for (let i = 0; i < formData.barcodes.length; i++) {
      const barcode = formData.barcodes[i];
      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '180px';
      tempDiv.style.height = '100px';
      tempDiv.style.display = 'flex';
      tempDiv.style.flexDirection = 'column';
      tempDiv.style.alignItems = 'center';
      tempDiv.style.justifyContent = 'center';
      tempDiv.style.background = 'white';
      tempDiv.innerHTML = `
        <div style="font-size:12px;font-weight:bold;margin-bottom:2px;text-align:center;">${formData.name}</div>
        <div style="font-size:10px;margin-bottom:2px;">${barcode.colorName} - ${barcode.size}</div>
        <svg id="barcode-svg-${i}"></svg>
        <div style="font-size:10px;margin-top:2px;">${barcode.value}</div>
      `;
      document.body.appendChild(tempDiv);
      // Render barcode SVG
      // @ts-ignore
      await import('jsbarcode').then(jsbarcode => {
        jsbarcode.default(`#barcode-svg-${i}`, barcode.value, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0
        });
      });
      // Convert to image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempDiv, { backgroundColor: '#fff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage([50, 30], 'portrait');
      pdf.addImage(imgData, 'PNG', 0, 0, 50, 30);
      document.body.removeChild(tempDiv);
    }
    pdf.save(`${formData.name.replace(/\s+/g, '_')}_barcodes.pdf`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <button
              onClick={() => router.push('/admin/products')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Products
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price for Customization (£)
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a gender</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="tshirts">T-Shirts</option>
                  <option value="jerseys">Jerseys</option>
                  <option value="tanktops">Tank Tops</option>
                  <option value="longsleeve">Long Sleeve Shirts</option>
                  <option value="hoodies">Hoodies</option>
                  <option value="sweatshirts">Sweatshirts</option>
                  <option value="sweatpants">Sweatpants</option>
                  <option value="accessories">Accessories</option>
                  <option value="shortsleeve">Short Sleeve</option>
                  <option value="crewneck">Crewneck</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Featured Product
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="customizable"
                  checked={formData.customizable}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Customizable Product
                </label>
              </div>
            </div>

            {/* Sizes and Stock */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 required-field">
                Sizes and Stock
              </label>
              {formData.gender === 'kids' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['0–3M', '3–6M', '6–12M', '1–2Y', '2–3Y', '3–4Y', '5–6Y', '7–8Y', '9–10Y', '11–12Y', '13–14Y'].map((size) => (
                    <div 
                      key={size} 
                      className={`p-4 rounded-lg border ${
                        formData.sizes.includes(size) 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sizes.includes(size)}
                            onChange={() => handleSizeChange(size)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 font-medium">{size}</span>
                        </label>
                      </div>
                      {formData.sizes.includes(size) && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={formData.stock[size] || 0}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="Quantity"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                    <div 
                      key={size} 
                      className={`p-4 rounded-lg border ${
                        formData.sizes.includes(size) 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sizes.includes(size)}
                            onChange={() => handleSizeChange(size)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 font-medium">{size}</span>
                        </label>
                      </div>
                      {formData.sizes.includes(size) && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={formData.stock[size] || 0}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="Quantity"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available Colors
                </label>
                <button
                  type="button"
                  onClick={addColor}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  + Add Color
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">🎨 Color Selection & Stock Management</h4>
                <p className="text-xs text-blue-700">
                  When customers view this product, they'll be able to click on color dots to see different images. 
                  You can also manage stock levels separately for each color variant:
                </p>
                <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                  <li>Use the color dropdowns on existing and new images</li>
                  <li>Add direct image URLs for each color</li>
                  <li>Upload images directly for each color variant</li>
                  <li>Set individual stock levels for each color and size combination</li>
                </ul>
              </div>
              <div className="space-y-4">
                {formData.colors.map((color, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                        placeholder="Color name (e.g., Red, Blue, Navy)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="color"
                        value={color.hexCode}
                        onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300"
                        title="Select color"
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-red-600 hover:text-red-700 px-2 py-1"
                        title="Remove color"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color-Specific Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={color.imageUrl || ''}
                          onChange={(e) => handleColorChange(index, 'imageUrl', e.target.value)}
                          placeholder="https://example.com/red-shirt.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Direct image URL for this specific color variant
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Or Upload Color Image
                        </label>
                        <div className="flex items-center space-x-3">
                          {colorImageUploads[index] ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={colorImageUploads[index]!.preview}
                                  alt={`${color.name} preview`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleColorImageRemove(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                id={`color-image-${index}`}
                                accept="image/*"
                                onChange={(e) => handleColorImageSelect(index, e)}
                                className="hidden"
                              />
                              <label
                                htmlFor={`color-image-${index}`}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm"
                              >
                                Upload Image
                              </label>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Upload an image specifically for this color variant
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Levels for {color.name || 'this color'}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {formData.sizes.map((size) => (
                            <div key={size} className="flex flex-col">
                              <label className="text-xs text-gray-600 mb-1">{size}</label>
                              <input
                                type="number"
                                value={color.stock?.[size] || 0}
                                onChange={(e) => handleColorStockChange(index, size, e.target.value)}
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Set stock levels for each size of this color variant
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Product Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Existing Images */}
                {formData.images.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index, true)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'existing')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                
                {/* New Uploaded Images */}
                {uploadedImages.map((image, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'uploaded')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {/* URL Images */}
                {urlImages.map((image, index) => (
                  <div key={`url-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo.jpg';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUrlImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'url')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {/* Add Image Buttons */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">Upload Image</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <FaLink className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">Add URL</span>
                  </div>
                </button>
              </div>
              
              {/* URL Input Modal */}
              {showUrlInput && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Add Image URL</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={imageAlt}
                          onChange={(e) => setImageAlt(e.target.value)}
                          placeholder="Product image description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color (Optional)
                        </label>
                        <select
                          value={imageColor}
                          onChange={(e) => setImageColor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">No specific color</option>
                          {formData.colors.map((color, index) => (
                            <option key={index} value={color.name}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Associate this image with a specific color
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(false);
                          setImageUrl('');
                          setImageAlt('');
                          setImageColor('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUrlImageAdd}
                        disabled={!imageUrl.trim() || !imageAlt.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        Add Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p>Upload product images (PNG, JPG up to 5MB) or add image URLs</p>
                <p className="text-purple-600 font-medium">💡 Tip: Use the color dropdowns to associate images with specific colors for the color selection feature!</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* Barcode Section */}
          <div className="mt-10 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Product Barcodes</h2>
            {formData.barcodes && formData.barcodes.length > 0 ? (
              <div className="space-y-4">
               <button
                 onClick={handleExportAllBarcodesPDF}
                 className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
               >
                 Export All Barcodes for Printing (PDF)
               </button>
                {formData.barcodes.map((barcode, idx) => (
                  <div key={barcode.value + barcode.colorName + barcode.size + idx} className="flex items-center gap-4 bg-white p-4 rounded shadow">
                    <Barcode
                      value={barcode.value}
                      format="CODE128"
                      width={2}
                      height={60}
                      displayValue={true}
                      fontSize={14}
                    />
                    <div>
                      <div className="font-semibold text-xs mb-1">{formData.name} - <span style={{ color: barcode.colorHex }}>{barcode.colorName}</span> - {barcode.size}</div>
                      <div className="text-xs text-gray-700">{barcode.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No barcodes assigned. Use the Barcodes tab to generate them.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 