'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUpload, FaTrash, FaLink, FaPlus } from 'react-icons/fa';
import ProductImageOverlay from '@/app/components/ProductImageOverlay';

interface ProductFormData {
  name: string;
  description: string;
  productDetails: string;
  price: string;
  category: string;
  gender: string;
  images: Array<{ url: string; alt: string; color?: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string; imageUrl?: string; stock?: { [size: string]: number } }>;
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
  const mockupFileInputRef = useRef<HTMLInputElement>(null);
  const designFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string; color?: string }>>([]);
  const [urlImages, setUrlImages] = useState<Array<{ url: string; alt: string; color?: string }>>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageColor, setImageColor] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [mockupImage, setMockupImage] = useState<{ file: File | null; preview: string | null; url?: string; alt?: string }>({ file: null, preview: null });
  const [designImage, setDesignImage] = useState<{ file: File | null; preview: string | null; url?: string; alt?: string }>({ file: null, preview: null });
  const [mockupImageUrl, setMockupImageUrl] = useState('');
  const [mockupImageAlt, setMockupImageAlt] = useState('');
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [designImageAlt, setDesignImageAlt] = useState('');
  const [designPosition, setDesignPosition] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(100);
  const [designRotation, setDesignRotation] = useState(0);
  const [presets, setPresets] = useState<Array<{ _id: string; name: string; description?: string; position: { x: number; y: number }; scale: number; rotation: number }>>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetLoading, setPresetLoading] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    productDetails: '',
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

  // Fetch presets on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchPresets();
    }
  }, [status, session]);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/admin/design-presets');
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const handleLoadPreset = () => {
    if (!selectedPreset) return;
    const preset = presets.find(p => p._id === selectedPreset);
    if (preset) {
      setDesignPosition(preset.position);
      setDesignScale(preset.scale);
      setDesignRotation(preset.rotation);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    setPresetLoading(true);
    try {
      const response = await fetch('/api/admin/design-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim(),
          position: designPosition,
          scale: designScale,
          rotation: designRotation
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPresets([...presets, data.preset]);
        setPresetName('');
        setPresetDescription('');
        setShowSavePresetModal(false);
        alert('Preset saved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save preset');
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    } finally {
      setPresetLoading(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      const response = await fetch(`/api/admin/design-presets/${presetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPresets(presets.filter(p => p._id !== presetId));
        if (selectedPreset === presetId) {
          setSelectedPreset('');
        }
        alert('Preset deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete preset');
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.preview));
      if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
      if (designImage.preview) URL.revokeObjectURL(designImage.preview);
    };
  }, [uploadedImages, mockupImage.preview, designImage.preview]);

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

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleImageColorChange = (index: number, color: string, type: 'uploaded' | 'url') => {
    if (type === 'uploaded') {
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

  const handleMockupImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear existing preview/URL when selecting new file
      if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
      setMockupImage({
        file,
        preview: URL.createObjectURL(file),
        alt: ''
      });
      // Clear URL input when uploading new file
      setMockupImageUrl('');
    }
  };

  const handleDesignImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear existing preview/URL when selecting new file
      if (designImage.preview) URL.revokeObjectURL(designImage.preview);
      setDesignImage({
        file,
        preview: URL.createObjectURL(file),
        alt: ''
      });
      // Clear URL input when uploading new file
      setDesignImageUrl('');
    }
  };

  const handleMockupImageRemove = () => {
    if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
    setMockupImage({ file: null, preview: null });
    setMockupImageUrl('');
    setMockupImageAlt('');
    // Reset file input to allow re-uploading
    if (mockupFileInputRef.current) {
      mockupFileInputRef.current.value = '';
    }
  };

  const handleDesignImageRemove = () => {
    if (designImage.preview) URL.revokeObjectURL(designImage.preview);
    setDesignImage({ file: null, preview: null });
    setDesignImageUrl('');
    setDesignImageAlt('');
    // Reset file input to allow re-uploading
    if (designFileInputRef.current) {
      designFileInputRef.current.value = '';
    }
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

    if (!formData.category) {
      errors.category = 'Category is required';
      isValid = false;
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }

    if (formData.sizes.length === 0) {
      errors.sizes = 'At least one size is required';
      isValid = false;
    }

    // Images are optional if mockup/design images are provided
    const hasMockupDesign = (mockupImage.file || mockupImageUrl) && (designImage.file || designImageUrl);
    const hasLegacyImages = uploadedImages.length > 0 || urlImages.length > 0;
    
    if (!hasMockupDesign && !hasLegacyImages) {
      errors.images = 'Either mockup/design images or legacy product images are required';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add basic product data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('productDetails', formData.productDetails || '');
      formDataToSend.append('price', formData.price);
      formDataToSend.append('basePrice', formData.basePrice);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('featured', formData.featured.toString());
      formDataToSend.append('customizable', formData.customizable.toString());
      formDataToSend.append('sizes', JSON.stringify(formData.sizes));
      console.log('Form data colors being sent:', formData.colors);
      formDataToSend.append('colors', JSON.stringify(formData.colors));
      formDataToSend.append('stock', JSON.stringify(formData.stock));

      // Add uploaded images with color data
      uploadedImages.forEach((image, index) => {
        formDataToSend.append('images', image.file);
        if (image.color) {
          formDataToSend.append(`imageColors_${index}`, image.color);
        }
      });

      // Add URL images with color data
      if (urlImages.length > 0) {
        formDataToSend.append('urlImages', JSON.stringify(urlImages));
      }

      // Add mockup image
      if (mockupImage.file) {
        formDataToSend.append('mockupImage', mockupImage.file);
        formDataToSend.append('mockupImageAlt', mockupImageAlt || 'Product mockup');
      } else if (mockupImageUrl) {
        formDataToSend.append('mockupImageUrl', mockupImageUrl);
        formDataToSend.append('mockupImageAlt', mockupImageAlt || 'Product mockup');
      }

      // Add design image
      if (designImage.file) {
        formDataToSend.append('designImage', designImage.file);
        formDataToSend.append('designImageAlt', designImageAlt || 'Product design');
      } else if (designImageUrl) {
        formDataToSend.append('designImageUrl', designImageUrl);
        formDataToSend.append('designImageAlt', designImageAlt || 'Product design');
      }
      
      // Add design image transformations
      formDataToSend.append('designPositionX', designPosition.x.toString());
      formDataToSend.append('designPositionY', designPosition.y.toString());
      formDataToSend.append('designScale', designScale.toString());
      formDataToSend.append('designRotation', designRotation.toString());

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      router.push('/admin/products');
    } catch (err) {
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

  // Size options
  const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const KID_SIZES = ['0–3M', '3–6M', '6–12M', '1–2Y', '2–3Y', '3–4Y', '5–6Y', '7–8Y', '9–10Y', '11–12Y', '13–14Y'];

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
            {/* Mockup and Design Images Section - PRIMARY METHOD */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Mockup & Design Images <span className="text-green-600 font-semibold">(Primary Method - Recommended)</span>
              </label>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <span>⭐</span> Primary Product Display Method
                </h4>
                <p className="text-xs text-green-800 mb-2">
                  <strong>This is the preferred way to display products.</strong> Upload a base mockup image (the product template) and a design image that will be overlaid on top of it.
                  The design image will be displayed on top of the mockup to show how the product will look. These images will be used for product cards and detail pages.
                </p>
                <p className="text-xs text-green-700 font-medium">
                  💡 Tip: You can adjust the position, size, and rotation of the design image using the controls below. Legacy images (below) are optional and only used as a fallback.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mockup Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mockup Image (Base Template)
                  </label>
                  {mockupImage.preview ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={mockupImage.preview}
                          alt="Mockup preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleMockupImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : mockupImageUrl ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={mockupImageUrl}
                          alt="Mockup"
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
                        onClick={handleMockupImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (mockupFileInputRef.current) {
                          mockupFileInputRef.current.value = ''; // Reset to allow selecting same file again
                          mockupFileInputRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors"
                    >
                      <div className="text-center">
                        <FaUpload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-600">
                          {(mockupImage.preview || mockupImageUrl) ? 'Replace Mockup' : 'Upload Mockup'}
                        </span>
                      </div>
                    </button>
                    <input
                      type="file"
                      ref={mockupFileInputRef}
                      onChange={handleMockupImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="text-xs text-gray-500">Or enter URL:</div>
                    <input
                      type="url"
                      value={mockupImageUrl}
                      onChange={(e) => setMockupImageUrl(e.target.value)}
                      placeholder="https://example.com/mockup.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={mockupImageAlt}
                      onChange={(e) => setMockupImageAlt(e.target.value)}
                      placeholder="Mockup alt text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Design Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Design Image (Overlay)
                  </label>
                  {designImage.preview ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={designImage.preview}
                          alt="Design preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDesignImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : designImageUrl ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={designImageUrl}
                          alt="Design"
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
                        onClick={handleDesignImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (designFileInputRef.current) {
                          designFileInputRef.current.value = ''; // Reset to allow selecting same file again
                          designFileInputRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors"
                    >
                      <div className="text-center">
                        <FaUpload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-600">
                          {(designImage.preview || designImageUrl) ? 'Replace Design' : 'Upload Design'}
                        </span>
                      </div>
                    </button>
                    <input
                      type="file"
                      ref={designFileInputRef}
                      onChange={handleDesignImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="text-xs text-gray-500">Or enter URL:</div>
                    <input
                      type="url"
                      value={designImageUrl}
                      onChange={(e) => setDesignImageUrl(e.target.value)}
                      placeholder="https://example.com/design.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={designImageAlt}
                      onChange={(e) => setDesignImageAlt(e.target.value)}
                      placeholder="Design alt text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Design Image Position & Scale Controls */}
            {(designImage.preview || designImageUrl) && (
              <div className="space-y-4 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Design Image Position & Size (Design Only)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Adjust the position, size, and rotation of the <strong>design image only</strong>. The mockup image remains unchanged.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Adjust the sliders below and watch the live preview update in real-time. These settings will be saved automatically when you click "Create Product" at the bottom of the page.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Position X */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horizontal Position: {designPosition.x}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={designPosition.x}
                      onChange={(e) => setDesignPosition({ ...designPosition, x: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Left</span>
                      <span>Center</span>
                      <span>Right</span>
                    </div>
                  </div>

                  {/* Position Y */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vertical Position: {designPosition.y}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={designPosition.y}
                      onChange={(e) => setDesignPosition({ ...designPosition, y: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Top</span>
                      <span>Center</span>
                      <span>Bottom</span>
                    </div>
                  </div>

                  {/* Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size: {designScale}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={designScale}
                      onChange={(e) => setDesignScale(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation: {designRotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={designRotation}
                      onChange={(e) => setDesignRotation(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-180°</span>
                      <span>0°</span>
                      <span>180°</span>
                    </div>
                  </div>
                </div>

                {/* Preset Management */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Presets
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Save your current settings as a preset to reuse for future products, or load an existing preset.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Load Preset */}
                    <div className="flex gap-2">
                      <select
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a preset to load...</option>
                        {presets.map(preset => (
                          <option key={preset._id} value={preset._id}>
                            {preset.name} {preset.description ? `- ${preset.description}` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleLoadPreset}
                        disabled={!selectedPreset}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Load
                      </button>
                    </div>

                    {/* Save Preset Button */}
                    <button
                      type="button"
                      onClick={() => setShowSavePresetModal(true)}
                      className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <FaPlus className="h-4 w-4" />
                      Save Current Settings as Preset
                    </button>

                    {/* Preset List with Delete */}
                    {presets.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700 mb-2">Saved Presets:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {presets.map(preset => (
                            <div key={preset._id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {preset.name}
                                {preset.description && <span className="text-gray-400 ml-1">({preset.description})</span>}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(preset._id)}
                                className="text-red-600 hover:text-red-800 ml-2"
                                title="Delete preset"
                              >
                                <FaTrash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDesignPosition({ x: 0, y: 0 });
                      setDesignScale(100);
                      setDesignRotation(0);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}

            {/* Save Preset Modal */}
            {showSavePresetModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Design Preset</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preset Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="e.g., Centered Large Design"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={presetDescription}
                        onChange={(e) => setPresetDescription(e.target.value)}
                        placeholder="e.g., For large logos centered on t-shirts"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        maxLength={500}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Current Settings:</strong><br />
                        Position: X={designPosition.x}%, Y={designPosition.y}%<br />
                        Scale: {designScale}%<br />
                        Rotation: {designRotation}°
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSavePresetModal(false);
                        setPresetName('');
                        setPresetDescription('');
                      }}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={presetLoading || !presetName.trim()}
                      className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {presetLoading ? 'Saving...' : 'Save Preset'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Full Scale Preview Modal */}
            {showFullPreview && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                onClick={() => setShowFullPreview(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h3 className="text-lg font-semibold text-gray-900">Full Scale Preview - Product Card</h3>
                    <button
                      type="button"
                      onClick={() => setShowFullPreview(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                      aria-label="Close preview"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div 
                          className="relative bg-gray-100"
                          style={{
                            aspectRatio: '1/1',
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            isolation: 'isolate'
                          }}
                        >
                          {(mockupImage.preview || mockupImageUrl || designImage.preview || designImageUrl) ? (
                            <ProductImageOverlay
                              key={`full-preview-${mockupImage.preview || mockupImageUrl || 'no-mockup'}-${designImage.preview || designImageUrl || 'no-design'}`}
                              mockupImage={
                                mockupImage.preview 
                                  ? { url: mockupImage.preview, alt: mockupImageAlt || 'Mockup preview' }
                                  : mockupImageUrl 
                                  ? { url: mockupImageUrl, alt: mockupImageAlt || 'Mockup' }
                                  : undefined
                              }
                              designImage={
                                designImage.preview 
                                  ? { 
                                      url: designImage.preview, 
                                      alt: designImageAlt || 'Design preview',
                                      position: designPosition,
                                      scale: designScale,
                                      rotation: designRotation
                                    }
                                  : designImageUrl 
                                  ? { 
                                      url: designImageUrl, 
                                      alt: designImageAlt || 'Design',
                                      position: designPosition,
                                      scale: designScale,
                                      rotation: designRotation
                                    }
                                  : undefined
                              }
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
                                MR SHIRT PERSONALISATION LTD
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Preview Section */}
            {(mockupImage.preview || mockupImageUrl || designImage.preview || designImageUrl || formData.name) && (
              <div className="space-y-4 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Live Preview - Product Card
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is how your product will appear on the frontend with the mockup and design images overlapping.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-800 font-medium">
                    💾 <strong>Save Note:</strong> The positioning, size, and rotation settings you adjust above will be automatically saved when you click "Create Product" at the bottom of the form. This preview shows exactly how it will appear to customers.
                  </p>
                </div>
                <div className="max-w-sm mx-auto">
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    👆 Click the preview card to view at full scale
                  </p>
                  <div 
                    className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => setShowFullPreview(true)}
                  >
                    <div 
                      className="relative bg-gray-100"
                      style={{
                        aspectRatio: '1/1',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        isolation: 'isolate' // Isolate this container from transforms
                      }}
                    >
                      {(mockupImage.preview || mockupImageUrl || designImage.preview || designImageUrl) ? (
                        <ProductImageOverlay
                          key={`preview-${mockupImage.preview || mockupImageUrl || 'no-mockup'}-${designImage.preview || designImageUrl || 'no-design'}`}
                          mockupImage={
                            mockupImage.preview 
                              ? { url: mockupImage.preview, alt: mockupImageAlt || 'Mockup preview' }
                              : mockupImageUrl 
                              ? { url: mockupImageUrl, alt: mockupImageAlt || 'Mockup' }
                              : undefined
                          }
                          designImage={
                            designImage.preview 
                              ? { 
                                  url: designImage.preview, 
                                  alt: designImageAlt || 'Design preview',
                                  position: designPosition,
                                  scale: designScale,
                                  rotation: designRotation
                                }
                              : designImageUrl 
                              ? { 
                                  url: designImageUrl, 
                                  alt: designImageAlt || 'Design',
                                  position: designPosition,
                                  scale: designScale,
                                  rotation: designRotation
                                }
                              : undefined
                          }
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
                            MR SHIRT PERSONALISATION LTD
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {formData.name || 'Product Name'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {formData.category || 'Category'}
                      </p>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {formData.description || 'Product description will appear here...'}
                      </p>
                      {formData.colors.length > 0 && (
                        <div className="flex items-center mb-3">
                          <span className="text-xs text-gray-500 mr-2">Colors:</span>
                          <div className="flex space-x-1">
                            {formData.colors.slice(0, 5).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.hexCode }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        {formData.price && formData.basePrice && parseFloat(formData.basePrice) > parseFloat(formData.price) ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs text-red-600 line-through tracking-tight">
                              RRP: £{parseFloat(formData.basePrice).toFixed(2)}
                            </span>
                            <span className="text-xl font-bold text-green-700 leading-tight">
                              £{parseFloat(formData.price).toFixed(2)}
                            </span>
                          </div>
                        ) : formData.price ? (
                          <span className="text-lg font-bold text-purple-600">
                            £{parseFloat(formData.price).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-purple-600">£0.00</span>
                        )}
                        <span className="text-sm text-purple-600">View Details →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload Section - Legacy (Optional) */}
            <div className="space-y-2 border-t pt-6">
              <label className="block text-sm font-medium text-gray-700">
                Product Images (Legacy - Optional)
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800 font-medium mb-1">
                  ⚠️ Legacy System - Optional
                </p>
                <p className="text-xs text-yellow-700">
                  These images are only used as a fallback if mockup/design images are not provided. 
                  <strong> The mockup and design images above are the primary/preferred method</strong> and will be used for product cards and detail pages when available.
                </p>
              </div>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
                fieldErrors.images ? 'border border-red-300 rounded-lg p-4' : ''
              }`}>
                {/* Uploaded Images */}
                {uploadedImages.map((image, index) => (
                  <div key={`upload-${index}`} className="relative group">
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
              <div className="text-xs text-gray-500 space-y-1">
                <p>Upload product images (PNG, JPG up to 5MB) or add image URLs</p>
                <p className="text-purple-600 font-medium">💡 Tip: Use the color dropdowns to associate images with specific colors for the color selection feature!</p>
              </div>
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

              <div>
                <label htmlFor="productDetails" className="block text-sm font-medium text-gray-700">
                  Product Details
                </label>
                <textarea
                  name="productDetails"
                  value={formData.productDetails}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter product details that will be displayed in the accordion (e.g., material, care instructions, specifications)"
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This information will be displayed in the collapsible "Product Details" section on the product page.
                </p>
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
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="kids">Kids</option>
                </select>
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
                  <option value="shortsleeve">Short Sleeve</option>
                  <option value="crewneck">Crewneck</option>
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
                {formData.gender === 'kids' ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['0–3M', '3–6M', '6–12M', '1–2Y', '2–3Y', '3–4Y', '5–6Y', '7–8Y', '9–10Y', '11–12Y', '13–14Y'].map(size => (
                        <label key={size} className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={formData.sizes.includes(size)}
                            onChange={() => handleSizeChange(size)}
                            className="form-checkbox rounded text-blue-600"
                          />
                          <span className="text-xs">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-gray-500 mr-2">Adult Sizes:</span>
                    {ADULT_SIZES.map(size => (
                      <label key={size} className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                          className="form-checkbox rounded text-blue-600"
                        />
                        <span className="text-xs">{size}</span>
                      </label>
                    ))}
                  </div>
                )}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">🎨 Color Selection & Stock Management</h4>
                <p className="text-xs text-blue-700">
                  When customers view this product, they'll be able to click on color dots to see different images. 
                  You can also manage stock levels separately for each color variant:
                </p>
                <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                  <li>Use the color dropdowns on uploaded/URL images</li>
                  <li>Add direct image URLs for each color</li>
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
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent disabled:opacity-50"
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