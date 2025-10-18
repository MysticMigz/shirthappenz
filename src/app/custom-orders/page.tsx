'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: Array<{ url: string; alt: string }>;
  colors: Array<{ name: string; hexCode: string }>;
  sizes: string[];
  category: string;
}

interface CustomOrderForm {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone';
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Customization Information
  selectedProduct: string;
  quantity: number;
  sizeQuantities: { [color: string]: { [size: string]: number } };
  selectedColors: string[];
  printingType: 'dtf';
  printingSurface: string[];
  designLocation: string[];
  printSize: string;
  paperSize: 'A4' | 'A3';
  designFiles: File[];
  needsDesignAssistance: boolean;
  notes: string;
}

export default function CustomOrdersPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CustomOrderForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    company: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    selectedProduct: '',
    quantity: 3,
    sizeQuantities: {},
    selectedColors: [],
    printingType: 'dtf',
    printingSurface: [],
    designLocation: [],
    printSize: '',
    paperSize: 'A4',
    designFiles: [],
    needsDesignAssistance: false,
    notes: ''
  });

  const [selectedProductData, setSelectedProductData] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProductData(product || null);
    
    // Initialize size quantities (will be set when colors are selected)
    const initialSizeQuantities: { [color: string]: { [size: string]: number } } = {};
    
    setFormData(prev => ({
      ...prev,
      selectedProduct: productId,
      selectedColors: [],
      sizeQuantities: initialSizeQuantities
    }));
  };

  const handleSizeQuantityChange = (color: string, size: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      sizeQuantities: {
        ...prev.sizeQuantities,
        [color]: {
          ...prev.sizeQuantities[color],
          [size]: quantity
        }
      }
    }));
  };

  const handleColorChange = (colorName: string, checked: boolean) => {
    setFormData(prev => {
      const newSelectedColors = checked 
        ? [...prev.selectedColors, colorName]
        : prev.selectedColors.filter(color => color !== colorName);
      
      // Initialize size quantities for new colors
      const newSizeQuantities = { ...prev.sizeQuantities };
      if (checked && selectedProductData?.sizes) {
        newSizeQuantities[colorName] = {};
        selectedProductData.sizes.forEach(size => {
          newSizeQuantities[colorName][size] = 0;
        });
      } else if (!checked) {
        delete newSizeQuantities[colorName];
      }
      
      return {
        ...prev,
        selectedColors: newSelectedColors,
        sizeQuantities: newSizeQuantities
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'designFiles' && Array.isArray(value)) {
            // Handle multiple files
            value.forEach((file, index) => {
              formDataToSend.append(`designFile_${index}`, file);
            });
            formDataToSend.append('designFileCount', value.length.toString());
          } else if (key === 'printingSurface' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else if (key === 'designLocation' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else if (key === 'sizeQuantities' && typeof value === 'object') {
            // Handle size quantities object
            formDataToSend.append(key, JSON.stringify(value));
          } else if (key === 'selectedColors' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Custom order submitted successfully! We will contact you within 2 working days.' });
        
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          preferredContact: 'email',
          company: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          selectedProduct: '',
          quantity: 3,
          sizeQuantities: {},
          selectedColors: [],
          printingType: 'dtf',
          printingSurface: [],
          designLocation: [],
          printSize: '',
          paperSize: 'A4',
          designFiles: [],
          needsDesignAssistance: false,
          notes: ''
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to submit custom order. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting custom order:', error);
      setMessage({ type: 'error', text: 'Failed to submit custom order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Orders</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us about your idea. We will contact you within 2 working days to arrange all the details 
            to create the perfect customization for you.
          </p>
        </div>

        {/* Pricing Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">DTF Printing Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">A4 Size (210 x 297mm)</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">1-10 items:</span>
                  <span className="font-medium">£8.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">11-25 items:</span>
                  <span className="font-medium">£7.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">26-50 items:</span>
                  <span className="font-medium">£6.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">51+ items:</span>
                  <span className="font-medium">£5.50 per item</span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">A3 Size (297 x 420mm)</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">1-10 items:</span>
                  <span className="font-medium">£12.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">11-25 items:</span>
                  <span className="font-medium">£11.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">26-50 items:</span>
                  <span className="font-medium">£10.50 per item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">51+ items:</span>
                  <span className="font-medium">£9.50 per item</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Additional Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Prices include DTF printing and heat pressing</li>
              <li>• Setup fees may apply for complex designs</li>
              <li>• Rush orders (under 5 days) may incur additional charges</li>
              <li>• Design assistance available for an additional fee</li>
              <li>• Free shipping on orders over £100</li>
            </ul>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-6 rounded-lg shadow-lg border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-lg font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.type === 'success' ? 'Order Submitted Successfully!' : 'Submission Failed'}
                </h3>
                <p className={`mt-1 text-sm ${
                  message.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {message.text}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    message.type === 'success' 
                      ? 'text-green-500 hover:bg-green-100' 
                      : 'text-red-500 hover:bg-red-100'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    message.type === 'success' ? 'focus:ring-green-600' : 'focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-600 mb-6">Please introduce yourself. We will contact you within 2 working days to arrange all the details to create the perfect customization for you.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContact"
                      value="email"
                      checked={formData.preferredContact === 'email'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="preferredContact"
                      value="phone"
                      checked={formData.preferredContact === 'phone'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Phone
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                  Province *
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Customization Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Customization Information</h2>
            <p className="text-gray-600 mb-6">Now, tell us more about your design, the more the better</p>

            {/* Product Selection */}
            <div className="mb-6">
              <label htmlFor="selectedProduct" className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              <select
                id="selectedProduct"
                name="selectedProduct"
                required
                value={formData.selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - £{product.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Display */}
            {selectedProductData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {selectedProductData.images[0] && (
                    <Image
                      src={selectedProductData.images[0].url}
                      alt={selectedProductData.images[0].alt}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedProductData.name}</h3>
                    <p className="text-sm text-gray-600">£{selectedProductData.price}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Size Quantities */}
            {/* Quantity by Color and Size */}
            {selectedProductData && selectedProductData.sizes.length > 0 && formData.selectedColors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity by Color and Size
                </label>
                <div className="space-y-6">
                  {formData.selectedColors.map((color) => (
                    <div key={color} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: selectedProductData.colors.find(c => c.name === color)?.hexCode || '#000000' }}
                        />
                        <h4 className="font-medium text-gray-900">{color}</h4>
                      </div>
                      <div className="space-y-3">
                        {selectedProductData.sizes.sort((a, b) => {
                          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                          return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
                        }).map((size) => (
                          <div key={`${color}-${size}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">{size}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQty = formData.sizeQuantities[color]?.[size] || 0;
                                  if (currentQty > 0) {
                                    handleSizeQuantityChange(color, size, currentQty - 1);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={formData.sizeQuantities[color]?.[size] || 0}
                                onChange={(e) => handleSizeQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQty = formData.sizeQuantities[color]?.[size] || 0;
                                  handleSizeQuantityChange(color, size, currentQty + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>{color} Total:</strong> {Object.values(formData.sizeQuantities[color] || {}).reduce((sum, qty) => sum + qty, 0)} items
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Quantity:</strong> {Object.values(formData.sizeQuantities).reduce((colorSum, colorQuantities) => {
                      return colorSum + Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + qty, 0);
                    }, 0)} items
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Minimum order: 3 items total</p>
                </div>
              </div>
            )}

            {/* Color Selection */}
            {selectedProductData && selectedProductData.colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Product Colors (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-3">
                  {selectedProductData.colors.map((color) => (
                    <label key={color.name} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="selectedColors"
                        value={color.name}
                        checked={formData.selectedColors.includes(color.name)}
                        onChange={(e) => handleColorChange(color.name, e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-full border-2 ${
                          formData.selectedColors.includes(color.name)
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hexCode }}
                        title={color.name}
                      />
                      <span className="text-sm text-gray-700">{color.name}</span>
                    </label>
                  ))}
                </div>
                {formData.selectedColors.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">Please select at least one color</p>
                )}
              </div>
            )}


            {/* Printing Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Printing
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="printingType"
                    value="dtf"
                    checked={formData.printingType === 'dtf'}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">DTF (Direct to Film) Printing</div>
                    <div className="text-sm text-gray-600">
                      DTF printing uses a special film that is printed with your design and then heat-pressed onto the garment. This method provides vibrant colors, excellent durability, and works on both light and dark fabrics.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Care Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">DTF Care Instructions</h4>
              <p className="text-sm text-blue-800">
                DTF prints are durable and long-lasting. For best results, wash garments inside out in cold water (30°C or below) 
                and avoid using fabric softeners. Tumble dry on low heat or air dry. Do not iron directly on the print.
              </p>
            </div>

            {/* Printing Surface */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Printing Surface (Select all that apply)
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="front"
                    checked={formData.printingSurface.includes('front')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Front</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="back"
                    checked={formData.printingSurface.includes('back')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Back</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="sleeve"
                    checked={formData.printingSurface.includes('sleeve')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Sleeve</span>
                </label>
              </div>
              {formData.printingSurface.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one printing surface</p>
              )}
            </div>

            {/* Design Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Design Location (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'top-left', label: 'Top Left Corner' },
                  { value: 'top-center', label: 'Top Center' },
                  { value: 'top-right', label: 'Top Right Corner' },
                  { value: 'center-left', label: 'Center Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'center-right', label: 'Center Right' },
                  { value: 'bottom-left', label: 'Bottom Left Corner' },
                  { value: 'bottom-center', label: 'Bottom Center' },
                  { value: 'bottom-right', label: 'Bottom Right Corner' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="designLocation"
                      value={option.value}
                      checked={formData.designLocation.includes(option.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            designLocation: [...prev.designLocation, value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            designLocation: prev.designLocation.filter(location => location !== value)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.designLocation.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one design location</p>
              )}
            </div>

            {/* Paper Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paperSize"
                    value="A4"
                    checked={formData.paperSize === 'A4'}
                    onChange={handleInputChange}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">A4 (210 x 297mm)</div>
                    <div className="text-sm text-gray-600">Standard size - £8.50+ per item</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paperSize"
                    value="A3"
                    checked={formData.paperSize === 'A3'}
                    onChange={handleInputChange}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">A3 (297 x 420mm)</div>
                    <div className="text-sm text-gray-600">Large size - £12.50+ per item</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Print Size */}
            <div className="mb-6">
              <label htmlFor="printSize" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Print Size (Optional)
              </label>
              <input
                type="text"
                id="printSize"
                name="printSize"
                value={formData.printSize}
                onChange={handleInputChange}
                placeholder="e.g., 10cm x 15cm (if different from paper size)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Specify custom dimensions if your design is smaller than the selected paper size
              </p>
            </div>


            {/* File Upload */}
            <div className="mb-6">
              <label htmlFor="designFiles" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Your Design Files *
              </label>
              <input
                type="file"
                id="designFiles"
                name="designFiles"
                required
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.ai,.eps,.svg"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setFormData(prev => ({ ...prev, designFiles: files }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum file size 20MB per file | Recommended quality: 300DPI | You can upload multiple files
              </p>
              
              {/* Display selected files */}
              {formData.designFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                  <div className="space-y-1">
                    {formData.designFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design Assistance */}
            <div className="mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="needsDesignAssistance"
                  checked={formData.needsDesignAssistance}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Will you need design assistance? This service will have an additional fee.
                </span>
              </label>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="We want to create the perfect product for you, give us as much detail as possible."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Custom Order'}
            </button>
          </div>
        </form>

        {/* Contact Information */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            We will be more than happy to assist you to fill this form. Please contact one of our customer service agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h4 className="font-medium text-gray-900">Customer Service</h4>
              <p className="text-sm text-gray-600">customerservice@shirthappenz.com</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-gray-900">Sales</h4>
              <p className="text-sm text-gray-600">sales@shirthappenz.com</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-gray-900">Hotline</h4>
              <p className="text-sm text-gray-600">020 3597 3380</p>
              <p className="text-xs text-gray-500">Monday - Friday 9h-12h and 13h30-16h30</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
