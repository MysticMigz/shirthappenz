'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../AdminSidebar';

interface Collection {
  _id: string;
  name: string;
  description: string;
  slug: string;
  image?: {
    url: string;
    alt: string;
  };
  bannerImage?: {
    url: string;
    alt: string;
  };
  isActive: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: Array<{ url: string; alt: string }>;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    imageUrl: '',
    imageAlt: '',
    bannerImageUrl: '',
    bannerImageAlt: '',
    isActive: true,
    featured: false,
    sortOrder: 0,
    seoTitle: '',
    seoDescription: ''
  });

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      
      const data = await response.json();
      setCollections(data.collections || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const collectionData = {
        ...formData,
        image: formData.imageUrl ? { url: formData.imageUrl, alt: formData.imageAlt } : undefined,
        bannerImage: formData.bannerImageUrl ? { url: formData.bannerImageUrl, alt: formData.bannerImageAlt } : undefined
      };

      const url = editingCollection ? `/api/collections/${editingCollection._id}` : '/api/collections';
      const method = editingCollection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save collection');
      }

      await fetchCollections();
      resetForm();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving collection:', err);
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description,
      slug: collection.slug,
      imageUrl: collection.image?.url || '',
      imageAlt: collection.image?.alt || '',
      bannerImageUrl: collection.bannerImage?.url || '',
      bannerImageAlt: collection.bannerImage?.alt || '',
      isActive: collection.isActive,
      featured: collection.featured,
      sortOrder: collection.sortOrder,
      seoTitle: '',
      seoDescription: ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const response = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collection');
      }

      await fetchCollections();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting collection:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      imageUrl: '',
      imageAlt: '',
      bannerImageUrl: '',
      bannerImageAlt: '',
      isActive: true,
      featured: false,
      sortOrder: 0,
      seoTitle: '',
      seoDescription: ''
    });
    setEditingCollection(null);
    setShowCreateForm(false);
  };

  const openProductModal = async (collection: Collection) => {
    setSelectedCollection(collection);
    setShowProductModal(true);
    
    // Fetch products in this collection
    try {
      const response = await fetch(`/api/collections/${collection._id}/products`);
      if (response.ok) {
        const data = await response.json();
        setCollectionProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching collection products:', err);
      setCollectionProducts([]);
    }
  };

  const handleProductToggle = async (productId: string, isAdding: boolean) => {
    if (!selectedCollection) return;

    try {
      const response = await fetch(`/api/collections/${selectedCollection._id}/products`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] })
      });

      if (!response.ok) throw new Error(`Failed to ${isAdding ? 'add' : 'remove'} product from collection`);

      // Update local state
      if (isAdding) {
        const product = products.find(p => p._id === productId);
        if (product) {
          setCollectionProducts([...collectionProducts, product]);
        }
      } else {
        setCollectionProducts(collectionProducts.filter(p => p._id !== productId));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Collections Management</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Collection
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      name="imageAlt"
                      value={formData.imageAlt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      name="bannerImageUrl"
                      value={formData.bannerImageUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Image Alt Text
                    </label>
                    <input
                      type="text"
                      name="bannerImageAlt"
                      value={formData.bannerImageAlt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Active
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Featured
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingCollection ? 'Update' : 'Create'} Collection
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Collections List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Collections ({collections.length})</h2>
            </div>
            
            {collections.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No collections found. Create your first collection to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sort Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collections.map((collection) => (
                      <tr key={collection._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {collection.image && (
                              <img
                                src={collection.image.url}
                                alt={collection.image.alt}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {collection.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {collection.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              collection.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {collection.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {collection.featured && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {collection.sortOrder}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(collection.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openProductModal(collection)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Manage Products
                            </button>
                            <button
                              onClick={() => handleEdit(collection)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(collection._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Product Management Modal */}
        {showProductModal && selectedCollection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold mb-4">
                Manage Products for "{selectedCollection.name}"
              </h3>
              
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => {
                    const isInCollection = collectionProducts.some(p => p._id === product._id);
                    return (
                      <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {product.images[0] && (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                            <div className="text-xs text-gray-500">£{product.price.toFixed(2)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleProductToggle(product._id, !isInCollection)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isInCollection
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isInCollection ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
