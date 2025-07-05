'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUpload, FaTrash } from 'react-icons/fa';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  gender: string;
  images: Array<{ url: string; alt: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  featured: boolean;
  customizable: boolean;
  basePrice: string;
  stock: { [size: string]: number };
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  basePrice?: string;
  category?: string;
  gender?: string;
  sizes?: string;
  images?: string;
}

export default function NewProduct() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    gender: '',
    images: [],
    sizes: [],
    colors: [],
    featured: false,
    customizable: true,
    basePrice: '',
    stock: {}
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [uploadedImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'price' || name === 'basePrice') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (type === 'number') {
      // Convert to number and ensure it's not NaN
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? '' : numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleColorChange = (index: number, field: 'name' | 'hexCode', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#000000' }]
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
        preview: URL.createObjectURL(file)
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
      isValid = false;
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Valid price is required';
      isValid = false;
    }

    if (!formData.basePrice || isNaN(Number(formData.basePrice)) || Number(formData.basePrice) <= 0) {
      errors.basePrice = 'Valid base price is required';
      isValid = false;
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender';
      isValid = false;
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
      isValid = false;
    }

    if (formData.sizes.length === 0) {
      errors.sizes = 'Please select at least one size';
      isValid = false;
    }

    if (uploadedImages.length === 0) {
      errors.images = 'Please upload at least one image';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // First, upload all images
      const uploadedImageUrls = await Promise.all(
        uploadedImages.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image.file);

          try {
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Failed to upload ${image.file.name}`);
            }

            const data = await response.json();
            return {
              url: data.url,
              alt: data.alt || image.file.name
            };
          } catch (error) {
            throw new Error(`Failed to upload ${image.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );

      // Then create the product with the image URLs and required fields
      const productData = {
        ...formData,
        images: uploadedImageUrls,
        stock: formData.stock, // Use the stock object directly
        price: Number(formData.price),
        basePrice: Number(formData.basePrice),
        category: formData.category ? formData.category.toLowerCase() : '',
        gender: formData.gender ? formData.gender.toLowerCase() : '',
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
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
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 required-field">
                Product Images
              </label>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
                fieldErrors.images ? 'border border-red-300 rounded-lg p-4' : ''
              }`}>
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
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
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">Add Image</span>
                  </div>
                </button>
              </div>
              {fieldErrors.images && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.images}</p>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <p className="text-xs text-gray-500">Upload product images (PNG, JPG up to 5MB)</p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 required-field">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    fieldErrors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 required-field">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    fieldErrors.description 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 required-field">
                    Price
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">£</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      className={`block w-full pl-7 rounded-md sm:text-sm ${
                        fieldErrors.price 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 required-field">
                    Base Price
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">£</span>
                    </div>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="Enter base price"
                      className={`block w-full pl-7 rounded-md sm:text-sm ${
                        fieldErrors.basePrice 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.basePrice && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.basePrice}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 required-field">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    fieldErrors.gender 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                >
                  <option value="">Select a gender</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
                {fieldErrors.gender && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 required-field">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    fieldErrors.category 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                  }`}
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
                </select>
                {fieldErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
                )}
              </div>

              {/* Sizes and Stock */}
              <div className="space-y-4">
                <label className={`block text-sm font-medium text-gray-700 mb-4 required-field`}>
                  Sizes and Stock
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
                  fieldErrors.sizes ? 'border border-red-300 rounded-lg p-4' : ''
                }`}>
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
                              value={formData.stock[size]}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="Quantity"
                            />
                            <span className="ml-2 text-sm text-gray-500 whitespace-nowrap">in stock</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {fieldErrors.sizes && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.sizes}</p>
                )}
              </div>

              {/* Featured and Customizable */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="customizable"
                      checked={formData.customizable}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Customizable Product</span>
                  </label>
                </div>
              </div>
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
              <div className="space-y-2">
                {formData.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                      placeholder="Color name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="color"
                      value={color.hexCode}
                      onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)}
                      className="h-10 w-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 