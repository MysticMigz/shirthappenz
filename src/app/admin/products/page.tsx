'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import react-barcode to avoid SSR issues
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: Array<{ url: string; alt: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  stock: Map<string, Map<string, number>>;
  featured: boolean;
  customizable: boolean;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
  barcode?: string;
  collections?: Array<{ _id: string; name: string; slug: string }>;
}

interface Collection {
  _id: string;
  name: string;
  slug: string;
}

export default function AdminProducts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch collections
  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(searchTerm && { search: searchTerm }),
          ...(selectedCategory && { category: selectedCategory })
        });

        const response = await fetch(`/api/admin/products?${params}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchProducts();
      fetchCollections();
    }
  }, [session, page, searchTerm, selectedCategory]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleCollectionToggle = async (productId: string, collectionId: string, isAdding: boolean) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/products`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] })
      });

      if (!response.ok) throw new Error(`Failed to ${isAdding ? 'add' : 'remove'} product from collection`);

      // Update the product in the local state
      setProducts(products.map(product => {
        if (product._id === productId) {
          const updatedCollections = isAdding 
            ? [...(product.collections || []), collections.find(c => c._id === collectionId)!]
            : (product.collections || []).filter(c => c._id !== collectionId);
          return { ...product, collections: updatedCollections };
        }
        return product;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection');
    }
  };

  const openCollectionModal = (product: Product) => {
    setSelectedProduct(product);
    setShowCollectionModal(true);
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add New Product
            </button>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="t-shirts">T-Shirts</option>
              <option value="hoodies">Hoodies</option>
              <option value="sweatshirts">Sweatshirts</option>
              <option value="jerseys">Jerseys</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images[0] && (
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                         {product.barcode && (
                           <div className="mt-1 flex flex-col items-start">
                             <span className="text-xs text-purple-700 font-mono">{product.barcode}</span>
                             <div className="mt-1"><Barcode value={product.barcode} width={1.2} height={24} fontSize={10} /></div>
                           </div>
                         )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.collections && product.collections.length > 0 ? (
                          product.collections.map((collection) => (
                            <span
                              key={collection._id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {collection.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No collections</span>
                        )}
                      </div>
                      <button
                        onClick={() => openCollectionModal(product)}
                        className="mt-1 text-xs text-purple-600 hover:text-purple-800"
                      >
                        Manage Collections
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* TODO: Implement stock display */}
                      <span className="text-sm text-gray-500">In Stock</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/products/${product._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Collection Management Modal */}
        {showCollectionModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Manage Collections for "{selectedProduct.name}"
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {collections.map((collection) => {
                  const isInCollection = selectedProduct.collections?.some(c => c._id === collection._id);
                  return (
                    <div key={collection._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{collection.name}</span>
                      <button
                        onClick={() => handleCollectionToggle(selectedProduct._id, collection._id, !isInCollection)}
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

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCollectionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 