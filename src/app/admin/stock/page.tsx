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
  images: Array<{ url: string; alt: string; color?: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string; imageUrl?: string; stock?: { [size: string]: number } }>;
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
  const [editingColorStock, setEditingColorStock] = useState<{ [key: string]: { [colorName: string]: { [size: string]: number } } }>({});
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
        
        // Initialize color stock editing state
        const initialColorStockState = data.products.reduce((acc: any, product: Product) => {
          acc[product._id] = {};
          product.colors?.forEach(color => {
            if (color.stock) {
              acc[product._id][color.name] = { ...color.stock };
            }
          });
          return acc;
        }, {});
        setEditingColorStock(initialColorStockState);
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

  const handleColorStockChange = (productId: string, colorName: string, size: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setEditingColorStock(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [colorName]: {
          ...prev[productId]?.[colorName],
          [size]: quantity
        }
      }
    }));
    setHasChanges(prev => ({ ...prev, [productId]: true }));
    setSaveSuccess(prev => ({ ...prev, [productId]: false }));
  };

  const handleColorStockIncrement = (productId: string, colorName: string, size: string, increment: number) => {
    const currentValue = editingColorStock[productId]?.[colorName]?.[size] || 0;
    const newValue = Math.max(0, currentValue + increment);
    handleColorStockChange(productId, colorName, size, newValue.toString());
  };

  const handleSaveStock = async (productId: string) => {
    setSavingStock(prev => ({ ...prev, [productId]: true }));
    setSaveSuccess(prev => ({ ...prev, [productId]: false }));
    try {
      const colorsData = products.find(p => p._id === productId)?.colors?.map(color => ({
        ...color,
        stock: editingColorStock[productId]?.[color.name] || color.stock
      }));
      
      console.log('Sending colors data to API:', colorsData);
      console.log('Editing color stock state:', editingColorStock[productId]);
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          colors: colorsData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      // Update local state
      setProducts(prev => prev.map(product => 
        product._id === productId 
          ? { 
              ...product, 
              colors: product.colors?.map(color => ({
                ...color,
                stock: editingColorStock[productId]?.[color.name] || color.stock
              }))
            }
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

  const calculateColorTotalStock = (productId: string, colorName: string) => {
    const colorStock = editingColorStock[productId]?.[colorName] || {};
    return Object.values(colorStock).reduce((sum, quantity) => sum + quantity, 0);
  };

  const calculateProductTotalStock = (product: Product) => {
    const colorStock = product.colors?.reduce((total, color) => {
      return total + calculateColorTotalStock(product._id, color.name);
    }, 0) || 0;
    return colorStock;
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      if (sortField === 'totalStock') {
        const totalA = calculateProductTotalStock(a);
        const totalB = calculateProductTotalStock(b);
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
              <h1 className="text-2xl font-bold text-gray-900">Color Stock Management</h1>
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

            <div className="space-y-6">
              {sortedProducts.map((product) => (
                <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 relative">
                        <Image
                          src={product.images[0]?.url || '/placeholder.png'}
                          alt={product.images[0]?.alt || product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                        <p className="text-sm text-gray-600">
                          Total Stock: {calculateProductTotalStock(product)} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveStock(product._id)}
                        disabled={savingStock[product._id] || !hasChanges[product._id]}
                        className={`
                          inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                          ${hasChanges[product._id]
                            ? 'bg-white text-black hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                          disabled:opacity-50 transition-colors
                        `}
                      >
                        <FaSave className="w-4 h-4 mr-2" />
                        {savingStock[product._id] ? 'Saving...' : 'Save Changes'}
                      </button>
                      {saveSuccess[product._id] && (
                        <span className="text-sm text-green-600 font-medium">
                          Saved!
                        </span>
                      )}
                    </div>
                  </div>

                  {product.colors && product.colors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {product.colors.map((color) => (
                        <div key={color.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center mb-3">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                              style={{ backgroundColor: color.hexCode }}
                            ></div>
                            <h4 className="text-sm font-medium text-gray-900">{color.name}</h4>
                            <span className="ml-auto text-xs text-gray-500">
                              Total: {calculateColorTotalStock(product._id, color.name)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {sortSizes(product.sizes).map((size) => {
                              const stockLevel = editingColorStock[product._id]?.[color.name]?.[size] || 0;
                              const isLowStock = stockLevel <= LOW_STOCK_THRESHOLD;
                              return (
                                <div key={size} className="flex flex-col items-center">
                                  <label className="text-xs font-medium text-gray-700 mb-1">{size}</label>
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => handleColorStockIncrement(product._id, color.name, size, -1)}
                                      className="p-1 rounded-l border border-r-0 border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                      <FaMinus className="w-2 h-2" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stockLevel}
                                      onChange={(e) => handleColorStockChange(product._id, color.name, size, e.target.value)}
                                      className={`
                                        w-12 h-6 text-center border-y shadow-sm text-xs
                                        focus:ring-1 focus:ring-purple-500 focus:border-transparent
                                        ${isLowStock 
                                          ? 'border-red-300 bg-red-50 text-red-900' 
                                          : 'border-gray-300 bg-white'
                                        }
                                      `}
                                    />
                                    <button
                                      onClick={() => handleColorStockIncrement(product._id, color.name, size, 1)}
                                      className="p-1 rounded-r border border-l-0 border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                      <FaPlus className="w-2 h-2" />
                                    </button>
                                  </div>
                                  {isLowStock && (
                                    <span className="text-[10px] text-red-600 font-medium mt-1">
                                      Low
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No colors configured for this product.</p>
                      <p className="text-sm">Add colors in the product edit page to manage color-specific stock.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}