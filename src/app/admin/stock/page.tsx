'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaMinus, FaPlus, FaSave } from 'react-icons/fa';

interface Product {
  _id: string;
  name: string;
  category: string;
  images: Array<{ url: string; alt: string }>;
  sizes: string[];
  stock: { [size: string]: number };
}

type SortField = 'name' | 'category' | 'totalStock';
type SortOrder = 'asc' | 'desc';

const LOW_STOCK_THRESHOLD = 5;

// Size order mapping for correct sorting
const SIZE_ORDER: { [key: string]: number } = {
  'XXS': 0,
  'XS': 1,
  'S': 2,
  'M': 3,
  'L': 4,
  'XL': 5,
  'XXL': 6,
  '2XL': 6, // Alternative notation
  'XXXL': 7,
  '3XL': 7, // Alternative notation
  '4XL': 8,
  '5XL': 9,
};

// Helper function to sort sizes
const sortSizes = (sizes: string[]): string[] => {
  return [...sizes].sort((a, b) => {
    const aOrder = SIZE_ORDER[a.toUpperCase()] ?? 999;
    const bOrder = SIZE_ORDER[b.toUpperCase()] ?? 999;
    return aOrder - bOrder;
  });
};

export default function StockManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingStock, setEditingStock] = useState<{ [key: string]: { [size: string]: number } }>({});
  const [savingStock, setSavingStock] = useState<{ [key: string]: boolean }>({});
  const [hasChanges, setHasChanges] = useState<{ [key: string]: boolean }>({});
  const [saveSuccess, setSaveSuccess] = useState<{ [key: string]: boolean }>({});

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products);
        
        // Initialize editing state
        const initialEditingState = data.products.reduce((acc: any, product: Product) => {
          acc[product._id] = { ...product.stock };
          return acc;
        }, {});
        setEditingStock(initialEditingState);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchProducts();
    }
  }, [session]);

  const handleStockChange = (productId: string, size: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setEditingStock(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [size]: quantity
      }
    }));
    setHasChanges(prev => ({ ...prev, [productId]: true }));
    setSaveSuccess(prev => ({ ...prev, [productId]: false }));
  };

  const handleStockIncrement = (productId: string, size: string, increment: number) => {
    const currentValue = editingStock[productId]?.[size] || 0;
    const newValue = Math.max(0, currentValue + increment);
    handleStockChange(productId, size, newValue.toString());
  };

  const handleSaveStock = async (productId: string) => {
    setSavingStock(prev => ({ ...prev, [productId]: true }));
    setSaveSuccess(prev => ({ ...prev, [productId]: false }));
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stock: editingStock[productId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      // Update local state
      setProducts(prev => prev.map(product => 
        product._id === productId 
          ? { ...product, stock: editingStock[productId] }
          : product
      ));
      setHasChanges(prev => ({ ...prev, [productId]: false }));
      setSaveSuccess(prev => ({ ...prev, [productId]: true }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [productId]: false }));
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSavingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const calculateTotalStock = (stock: { [size: string]: number }) => {
    return Object.values(stock).reduce((sum, quantity) => sum + quantity, 0);
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      if (sortField === 'totalStock') {
        const totalA = calculateTotalStock(a.stock);
        const totalB = calculateTotalStock(b.stock);
        return sortOrder === 'asc' ? totalA - totalB : totalB - totalA;
      }
      
      const valueA = a[sortField].toLowerCase();
      const valueB = b[sortField].toLowerCase();
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = sortProducts(filteredProducts);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Image
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        Category
                        {sortField === 'category' ? (
                          sortOrder === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer"
                      onClick={() => handleSort('totalStock')}
                    >
                      <div className="flex items-center">
                        Total
                        {sortField === 'totalStock' ? (
                          sortOrder === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock by Size
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.map((product) => (
                    <tr key={product._id} className={hasChanges[product._id] ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="h-20 w-20 relative">
                          <Image
                            src={product.images[0]?.url || '/placeholder.png'}
                            alt={product.images[0]?.alt || product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-[12rem]">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{calculateTotalStock(product.stock)}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                          {sortSizes(product.sizes).map((size) => {
                            const stockLevel = editingStock[product._id]?.[size] || 0;
                            const isLowStock = stockLevel <= LOW_STOCK_THRESHOLD;
                            return (
                              <div key={size} className="flex flex-col items-center">
                                <label className="text-xs font-medium text-gray-700 mb-1.5">{size}</label>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => handleStockIncrement(product._id, size, -1)}
                                    className="p-1.5 rounded-l border border-r-0 border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                                  >
                                    <FaMinus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={stockLevel}
                                    onChange={(e) => handleStockChange(product._id, size, e.target.value)}
                                    className={`
                                      w-14 h-[34px] text-center border-y shadow-sm text-sm
                                      focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                      ${isLowStock 
                                        ? 'border-red-300 bg-red-50 text-red-900' 
                                        : 'border-gray-300 bg-white'
                                      }
                                    `}
                                  />
                                  <button
                                    onClick={() => handleStockIncrement(product._id, size, 1)}
                                    className="p-1.5 rounded-r border border-l-0 border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                                  >
                                    <FaPlus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                {isLowStock && (
                                  <span className="text-[11px] text-red-600 font-medium mt-1">
                                    Low
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleSaveStock(product._id)}
                            disabled={savingStock[product._id] || !hasChanges[product._id]}
                            className={`
                              inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md
                              ${hasChanges[product._id]
                                ? 'bg-white text-black hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                              disabled:opacity-50 transition-colors
                            `}
                          >
                            <FaSave className="w-3 h-3 mr-1.5" />
                            {savingStock[product._id] ? 'Saving...' : 'Save'}
                          </button>
                          {saveSuccess[product._id] && (
                            <span className="text-xs text-green-600 font-medium text-center">
                              Saved!
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 