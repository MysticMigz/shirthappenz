'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrash, FaUpload, FaStore } from 'react-icons/fa';
import Image from 'next/image';

interface Supply {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  unit: string;
  category: string;
  minimumOrderQuantity: number;
  supplier: {
    name: string;
    contactInfo?: string;
    website?: string;
  };
}

interface SupplyFormData {
  name: string;
  description: string;
  price: number;
  unit: number;
  category: string;
  minimumOrderQuantity: number;
  supplier: {
    name: string;
    contactInfo: string;
    website: string;
  };
}

interface OrderItem {
  supply: Supply;
  quantity: number;
  notes?: string;
}

export default function SuppliesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupply, setNewSupply] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    category: 'paper',
    minimumOrderQuantity: 1,
    supplier: {
      name: '',
      contactInfo: '',
      website: ''
    }
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const categories = [
    'paper',
    'ink',
    'transfer',
    'cleaning',
    'maintenance',
    'packaging',
    'other'
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    fetchSupplies();
  }, [status, router]);

  const fetchSupplies = async () => {
    try {
      const response = await fetch('/api/admin/supplies');
      if (!response.ok) throw new Error('Failed to fetch supplies');
      const data = await response.json();
      setSupplies(data);
    } catch (err) {
      setError('Failed to load supplies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFormErrors(prev => ({
          ...prev,
          image: 'Image size must be less than 5MB'
        }));
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Only JPG, PNG, and WebP images are allowed'
        }));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
      setImageUrl('');
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newSupply.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!newSupply.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!newSupply.price || isNaN(Number(newSupply.price)) || Number(newSupply.price) <= 0) {
      errors.price = 'Please enter a valid price';
    }
    
    if (!newSupply.unit || isNaN(Number(newSupply.unit)) || Number(newSupply.unit) <= 0) {
      errors.unit = 'Please enter a valid quantity';
    }
    
    if (newSupply.minimumOrderQuantity < 1) {
      errors.minimumOrderQuantity = 'Minimum order quantity must be at least 1';
    }
    
    if (!newSupply.supplier.name.trim()) {
      errors.supplierName = 'Supplier name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let imageUrlToUse = '';
      
      if (imageInputType === 'file' && imageFile) {
        // Upload the file
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to upload image');
        const { url } = await uploadResponse.json();
        imageUrlToUse = url;
      } else if (imageInputType === 'url' && imageUrl) {
        imageUrlToUse = imageUrl;
      }

      // Create the supply
      const response = await fetch('/api/admin/supplies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSupply,
          price: Number(newSupply.price),
          image: imageUrlToUse || undefined
        }),
      });

      if (!response.ok) throw new Error('Failed to create supply');

      await fetchSupplies();
      setShowAddModal(false);
      setNewSupply({
        name: '',
        description: '',
        price: '',
        unit: '',
        category: 'paper',
        minimumOrderQuantity: 1,
        supplier: {
          name: '',
          contactInfo: '',
          website: ''
        }
      });
      setImageFile(null);
      setImagePreview(null);
      setImageUrl('');
      setFormErrors({});
    } catch (err) {
      setError('Failed to create supply');
      console.error(err);
    }
  };

  const addToOrder = (supply: Supply) => {
    setOrderItems((prev) => {
      const existingItem = prev.find(item => item.supply._id === supply._id);
      if (existingItem) {
        return prev.map(item =>
          item.supply._id === supply._id
            ? { ...item, quantity: item.quantity + supply.minimumOrderQuantity }
            : item
        );
      }
      return [...prev, { supply, quantity: supply.minimumOrderQuantity }];
    });
  };

  const removeFromOrder = (supplyId: string) => {
    setOrderItems(prev => prev.filter(item => item.supply._id !== supplyId));
  };

  const updateQuantity = (supplyId: string, newQuantity: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.supply._id === supplyId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const updateNotes = (supplyId: string, notes: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.supply._id === supplyId
          ? { ...item, notes }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.supply.price * item.quantity);
    }, 0);
  };

  const handleCreateOrder = async () => {
    try {
      const response = await fetch('/api/admin/supplies/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          notes: orderNotes,
          status: 'draft'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      setOrderItems([]);
      setOrderNotes('');
      setIsOrderModalOpen(false);
      router.push('/admin/supplies/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      console.error('Error creating order:', err);
    }
  };

  const toggleDescription = (supplyId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplyId)) {
        newSet.delete(supplyId);
      } else {
        newSet.add(supplyId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supplies Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/admin/supplies/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <FaStore className="mr-2" /> View Orders
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Supply
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Supply Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Supply</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                  setImageFile(null);
                  setImagePreview(null);
                  setImageUrl('');
                  setImageInputType('file');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSupply.name}
                      onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                      className={`w-full rounded-md shadow-sm ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      } focus:border-purple-500 focus:ring-purple-500`}
                      placeholder="Enter supply name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        £
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={newSupply.price}
                        onChange={(e) => setNewSupply({ ...newSupply, price: e.target.value })}
                        className={`w-full pl-7 rounded-md shadow-sm ${
                          formErrors.price ? 'border-red-500' : 'border-gray-300'
                        } focus:border-purple-500 focus:ring-purple-500`}
                        placeholder="0.00"
                      />
                    </div>
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newSupply.category}
                      onChange={(e) => setNewSupply({ ...newSupply, category: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newSupply.unit}
                      onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                      min="1"
                      className={`w-full rounded-md shadow-sm ${
                        formErrors.unit ? 'border-red-500' : 'border-gray-300'
                      } focus:border-purple-500 focus:ring-purple-500`}
                      placeholder="Enter quantity (e.g. 100)"
                    />
                    {formErrors.unit && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.unit}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newSupply.description}
                      onChange={(e) => setNewSupply({ ...newSupply, description: e.target.value })}
                      rows={3}
                      className={`w-full rounded-md shadow-sm ${
                        formErrors.description ? 'border-red-500' : 'border-gray-300'
                      } focus:border-purple-500 focus:ring-purple-500`}
                      placeholder="Enter supply description"
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Quantity
                    </label>
                    <input
                      type="number"
                      value={newSupply.minimumOrderQuantity}
                      onChange={(e) => setNewSupply({ ...newSupply, minimumOrderQuantity: parseInt(e.target.value) })}
                      min="1"
                      className={`w-full rounded-md shadow-sm ${
                        formErrors.minimumOrderQuantity ? 'border-red-500' : 'border-gray-300'
                      } focus:border-purple-500 focus:ring-purple-500`}
                    />
                    {formErrors.minimumOrderQuantity && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.minimumOrderQuantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-24 h-24 border rounded-lg overflow-hidden bg-gray-50">
                          {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={96}
                              height={96}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex space-x-4">
                            <button
                              type="button"
                              onClick={() => setImageInputType('file')}
                              className={`px-3 py-1 rounded-md text-sm ${
                                imageInputType === 'file'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageInputType('url')}
                              className={`px-3 py-1 rounded-md text-sm ${
                                imageInputType === 'url'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Image URL
                            </button>
                          </div>
                          
                          {imageInputType === 'file' ? (
                            <>
                              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                                <FaUpload className="mr-2" />
                                Choose Image
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handleImageChange}
                                />
                              </label>
                              <p className="text-xs text-gray-500">
                                JPG, PNG or WebP (max. 5MB)
                              </p>
                            </>
                          ) : (
                            <input
                              type="url"
                              value={imageUrl}
                              onChange={handleImageUrlChange}
                              placeholder="Enter image URL"
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                            />
                          )}
                        </div>
                      </div>
                      {formErrors.image && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.image}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSupply.supplier.name}
                      onChange={(e) => setNewSupply({
                        ...newSupply,
                        supplier: { ...newSupply.supplier, name: e.target.value }
                      })}
                      className={`w-full rounded-md shadow-sm ${
                        formErrors.supplierName ? 'border-red-500' : 'border-gray-300'
                      } focus:border-purple-500 focus:ring-purple-500`}
                      placeholder="Enter supplier name"
                    />
                    {formErrors.supplierName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.supplierName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      value={newSupply.supplier.contactInfo}
                      onChange={(e) => setNewSupply({
                        ...newSupply,
                        supplier: { ...newSupply.supplier, contactInfo: e.target.value }
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter contact information"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={newSupply.supplier.website}
                      onChange={(e) => setNewSupply({
                        ...newSupply,
                        supplier: { ...newSupply.supplier, website: e.target.value }
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormErrors({});
                    setImageFile(null);
                    setImagePreview(null);
                    setImageUrl('');
                    setImageInputType('file');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Supply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {supplies.map((supply) => (
          <div key={supply._id} className="bg-white rounded-lg shadow-md p-4">
            <div className="relative aspect-[4/3] mb-4 bg-gray-100 rounded-lg overflow-hidden">
              {supply.image ? (
                <Image
                  src={supply.image}
                  alt={supply.name}
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{supply.name}</h3>
            {supply.description && (
              <div className="mb-2">
                <p className="text-gray-600">
                  {expandedDescriptions.has(supply._id) 
                    ? supply.description 
                    : supply.description.slice(0, 100) + (supply.description.length > 100 ? '...' : '')}
                </p>
                {supply.description.length > 100 && (
                  <button
                    onClick={() => toggleDescription(supply._id)}
                    className="text-purple-600 hover:text-purple-800 text-sm mt-1"
                  >
                    {expandedDescriptions.has(supply._id) ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">£{supply.price}</span>
              <span className="text-gray-600">{supply.unit}</span>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <p>Category: {supply.category}</p>
              <p>Supplier: {supply.supplier.name}</p>
              <p>Min. Order: {supply.minimumOrderQuantity}</p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => addToOrder(supply)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {orderItems.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
          >
            View Order ({orderItems.length})
          </button>
        </div>
      )}

      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {orderItems.map((item) => (
              <div key={item.supply._id} className="border-b pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.supply.name}</h3>
                    <p className="text-sm text-gray-600">
                      £{item.supply.price} per {item.supply.unit} units
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromOrder(item.supply._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="mt-2 flex items-center">
                  <label className="text-sm text-gray-600 mr-2">Quantity:</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.supply._id, parseInt(e.target.value))}
                    min={item.supply.minimumOrderQuantity}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{item.supply.unit} units</span>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.supply._id, e.target.value)}
                    placeholder="Add notes..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <p className="mt-2 text-right font-medium">
                  Subtotal: £{(item.supply.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                rows={3}
                placeholder="Add any general notes for the order..."
              />
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-lg font-semibold">
                Total: £{calculateTotal().toFixed(2)}
              </div>
              <button
                onClick={handleCreateOrder}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 