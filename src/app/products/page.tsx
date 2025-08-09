'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  gender: string;
  images: Array<{ url: string; alt: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  featured: boolean;
  customizable: boolean;
}

interface Category {
  key: string;
  label: string;
  icon: JSX.Element;
}

interface CategoryVisibility {
  category: string;
  displayName: string;
  description: string;
  sortOrder: number;
  genderVisibility: {
    men: boolean;
    women: boolean;
    unisex: boolean;
    kids: boolean;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('men');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number | null }>({ min: 0, max: null });
  const [sortBy, setSortBy] = useState<'bestsellers' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest'>('bestsellers');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryVisibility, setCategoryVisibility] = useState<CategoryVisibility[]>([]);
  const [categoryVisibilityLoading, setCategoryVisibilityLoading] = useState(true);

  // Read search parameters from URL on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  useEffect(() => {
    fetchCategoryVisibility();
  }, [selectedGender]);

  const genderNav = [
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'unisex', label: 'Unisex' },
    { key: 'kids', label: 'Kids' },
  ];

  // Icons8 monochrome icon URLs (confirmed working as of June 2024)
  // t-shirt: https://img.icons8.com/ios-filled/50/000000/t-shirt--v1.png
  // jersey: https://img.icons8.com/ios-filled/50/000000/sports-jersey.png
  // tank top: https://img.icons8.com/ios-filled/50/000000/singlet.png
  // long sleeve: https://img.icons8.com/ios-filled/50/000000/jumper.png
  // hoodie: https://img.icons8.com/ios-filled/50/000000/hoodie--v2.png
  // sweatshirt: https://img.icons8.com/ios-filled/50/000000/sweater.png
  // sweatpants: https://img.icons8.com/ios-filled/50/000000/trousers.png
  const icons8 = {
    tshirts: 'https://img.icons8.com/ios-filled/50/000000/t-shirt--v1.png', // T-Shirt
    jerseys: 'https://img.icons8.com/?size=100&id=9Vy3icZB7N2U&format=png&color=000000', // Jersey (user-provided PNG)
    tanktops: 'https://img.icons8.com/?size=100&id=wABv7LDcLWpW&format=png&color=000000', // Tank Top (user-provided PNG)
    longsleeve: 'https://img.icons8.com/ios-filled/50/000000/jumper.png', // Long Sleeve (Jumper)
    hoodies: 'https://img.icons8.com/?size=100&id=MKsXeFPktvxv&format=png&color=000000', // Hoodie (user-provided PNG)
    sweatshirts: 'https://img.icons8.com/ios-filled/50/000000/sweater.png', // Sweater (Sweatshirt)
    sweatpants: 'https://img.icons8.com/ios-filled/50/000000/trousers.png', // Trousers (Sweatpants)
  };

  const allCategories: Record<string, Category[]> = {
    men: [
      { key: 'tshirts', label: 'T-Shirts', icon: <img src={icons8.tshirts} alt="T-Shirts" width={40} height={40} /> },
      { key: 'jerseys', label: 'Jerseys', icon: <img src={icons8.jerseys} alt="Jerseys" width={40} height={40} /> },
      { key: 'tanktops', label: 'Tank Tops', icon: <img src={icons8.tanktops} alt="Tank Tops" width={40} height={40} /> },
      { key: 'longsleeve', label: 'Long Sleeve Shirts', icon: <img src={icons8.longsleeve} alt="Long Sleeve Shirts" width={40} height={40} /> },
      { key: 'hoodies', label: 'Hoodies', icon: <img src={icons8.hoodies} alt="Hoodies" width={40} height={40} /> },
      { key: 'sweatshirts', label: 'Sweatshirts', icon: <img src={icons8.sweatshirts} alt="Sweatshirts" width={40} height={40} /> },
      { key: 'sweatpants', label: 'Sweatpants', icon: <img src={icons8.sweatpants} alt="Sweatpants" width={40} height={40} /> },
    ],
    women: [
      { key: 'tshirts', label: 'T-Shirts', icon: <img src={icons8.tshirts} alt="T-Shirts" width={40} height={40} /> },
      { key: 'jerseys', label: 'Jerseys', icon: <img src={icons8.jerseys} alt="Jerseys" width={40} height={40} /> },
      { key: 'tanktops', label: 'Tank Tops', icon: <img src={icons8.tanktops} alt="Tank Tops" width={40} height={40} /> },
      { key: 'longsleeve', label: 'Long Sleeve Shirts', icon: <img src={icons8.longsleeve} alt="Long Sleeve Shirts" width={40} height={40} /> },
      { key: 'hoodies', label: 'Hoodies', icon: <img src={icons8.hoodies} alt="Hoodies" width={40} height={40} /> },
      { key: 'sweatshirts', label: 'Sweatshirts', icon: <img src={icons8.sweatshirts} alt="Sweatshirts" width={40} height={40} /> },
      { key: 'sweatpants', label: 'Sweatpants', icon: <img src={icons8.sweatpants} alt="Sweatpants" width={40} height={40} /> },
    ],
    unisex: [
      { key: 'tshirts', label: 'T-Shirts', icon: <img src={icons8.tshirts} alt="T-Shirts" width={40} height={40} /> },
      { key: 'jerseys', label: 'Jerseys', icon: <img src={icons8.jerseys} alt="Jerseys" width={40} height={40} /> },
      { key: 'hoodies', label: 'Hoodies', icon: <img src={icons8.hoodies} alt="Hoodies" width={40} height={40} /> },
      { key: 'sweatshirts', label: 'Sweatshirts', icon: <img src={icons8.sweatshirts} alt="Sweatshirts" width={40} height={40} /> },
    ],
    kids: [
      { key: 'tshirts', label: 'T-Shirts', icon: <img src={icons8.tshirts} alt="T-Shirts" width={40} height={40} /> },
      { key: 'jerseys', label: 'Jerseys', icon: <img src={icons8.jerseys} alt="Jerseys" width={40} height={40} /> },
      { key: 'hoodies', label: 'Hoodies', icon: <img src={icons8.hoodies} alt="Hoodies" width={40} height={40} /> },
      { key: 'sweatshirts', label: 'Sweatshirts', icon: <img src={icons8.sweatshirts} alt="Sweatshirts" width={40} height={40} /> },
      { key: 'sweatpants', label: 'Sweatpants', icon: <img src={icons8.sweatpants} alt="Sweatpants" width={40} height={40} /> },
    ],
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    fetchCategoryVisibility();
  }, [selectedGender]);

  // Refresh category visibility when products change to ensure proper filtering
  useEffect(() => {
    if (products.length > 0 && !categoryVisibilityLoading) {
      // Force a re-render of categories when products change
      // This ensures categories are properly filtered based on available products
    }
  }, [products, categoryVisibilityLoading]);

  const fetchCategoryVisibility = async () => {
    try {
      setCategoryVisibilityLoading(true);
      const response = await fetch(`/api/category-visibility?gender=${selectedGender}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category visibility');
      }
      const data = await response.json();
      setCategoryVisibility(data.categories || []);
    } catch (err: any) {
      console.error('Error fetching category visibility:', err);
      // Fallback to default categories if API fails
      setCategoryVisibility([]);
      // Show a subtle error message in the console for admins
      if (process.env.NODE_ENV === 'development') {
        console.warn('Category visibility API failed, using default categories');
      }
    } finally {
      setCategoryVisibilityLoading(false);
    }
  };

  // Function to get filtered categories based on visibility settings
  const getFilteredCategories = (gender: string) => {
    if (categoryVisibilityLoading) {
      // While loading, show default categories but filter out those with no products
      const defaultCategories = allCategories[gender] || [];
      return defaultCategories.filter(cat => {
        const hasProducts = products.some(product => {
          const matchesCategory = product.category === cat.key;
          const matchesGender = product.gender === gender || 
            (product.gender === 'unisex' && (gender === 'men' || gender === 'women'));
          return matchesCategory && matchesGender;
        });
        return hasProducts;
      });
    }

    if (categoryVisibility.length === 0) {
      // Fallback to default categories if visibility settings haven't loaded yet
      // But still filter out categories with no products
      const defaultCategories = allCategories[gender] || [];
      return defaultCategories.filter(cat => {
        const hasProducts = products.some(product => {
          const matchesCategory = product.category === cat.key;
          const matchesGender = product.gender === gender || 
            (product.gender === 'unisex' && (gender === 'men' || gender === 'women'));
          return matchesCategory && matchesGender;
        });
        return hasProducts;
      });
    }

    // Filter categories based on visibility settings
    const visibleCategories = categoryVisibility
      .filter(cat => cat.genderVisibility[gender as keyof typeof cat.genderVisibility])
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Filter out categories that have no products for the selected gender
    const categoriesWithProducts = visibleCategories.filter(cat => {
      const hasProducts = products.some(product => {
        const matchesCategory = product.category === cat.category;
        const matchesGender = product.gender === gender || 
          (product.gender === 'unisex' && (gender === 'men' || gender === 'women'));
        return matchesCategory && matchesGender;
      });
      return hasProducts;
    });

    // Map visibility settings to category objects with custom display names
    return categoriesWithProducts.map(cat => {
      const defaultCategory = allCategories[gender]?.find(c => c.key === cat.category);
      return {
        key: cat.category,
        label: cat.displayName || defaultCategory?.label || cat.category,
        icon: defaultCategory?.icon || <span className="w-8 h-8 bg-gray-300 rounded"></span>
      };
    });
  };

  const fetchProducts = async () => {
    try {
      let url = '/api/products?';
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceRange.min) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max) params.append('maxPrice', priceRange.max.toString());
      if (sortBy) params.append('sortBy', sortBy);

      const response = await fetch(url + params.toString());
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'search') {
      setSearchQuery(value);
      // Update URL with search parameter
      const url = new URL(window.location.href);
      if (value.trim()) {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      window.history.replaceState({}, '', url.toString());
    } else if (key === 'category') {
      setSelectedCategory(value);
    } else if (key === 'minPrice') {
      setPriceRange(prev => ({ ...prev, min: Number(value) }));
    } else if (key === 'maxPrice') {
      setPriceRange(prev => ({ ...prev, max: value ? Number(value) : null }));
    } else if (key === 'sortBy') {
      setSortBy(value as typeof sortBy);
    }
  };

  const handleGenderClick = (key: string) => {
    setSelectedGender(key);
    setSelectedCategory('');
  };

  const handleCategoryClick = (key: string) => {
    setSelectedCategory(key);
  };

  // Reset selected category if it's not visible for the current gender
  useEffect(() => {
    if (selectedCategory && categoryVisibility.length > 0) {
      const categoryIsVisible = categoryVisibility.some(cat => 
        cat.category === selectedCategory && 
        cat.genderVisibility[selectedGender as keyof typeof cat.genderVisibility]
      );
      
      if (!categoryIsVisible) {
        setSelectedCategory('');
      }
    }
  }, [selectedGender, categoryVisibility, selectedCategory]);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGender = selectedGender === '' || 
        product.gender === selectedGender || 
        (product.gender === 'unisex' && (selectedGender === 'men' || selectedGender === 'women'));
      
      // Check if the product's category is visible for the selected gender
      const categoryIsVisible = categoryVisibility.length === 0 || 
        categoryVisibility.some(cat => 
          cat.category === product.category && 
          cat.genderVisibility[selectedGender as keyof typeof cat.genderVisibility]
        );
      
      const matchesCategory = selectedCategory === '' || product.category.toLowerCase().replace(/\s/g, '') === selectedCategory;
      
      const matchesPriceRange = (priceRange.max === null || product.basePrice <= priceRange.max) &&
        product.basePrice >= priceRange.min;

      return matchesSearch && matchesGender && categoryIsVisible && matchesCategory && matchesPriceRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.basePrice - b.basePrice;
        case 'price-desc':
          return b.basePrice - a.basePrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-4 sm:py-8">
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading products...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Our Products</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Discover our range of high-quality customizable apparel and accessories.
          </p>
        </div>

        {/* Gender Nav Bar */}
        <div className="flex justify-center gap-2 sm:gap-4 md:gap-8 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {genderNav.map((gender) => (
            <button
              key={gender.key}
              onClick={() => handleGenderClick(gender.key)}
              className={`px-4 sm:px-6 md:px-8 py-2 rounded-full font-semibold border border-black bg-white text-black transition-all duration-300 ease-in-out flex-shrink-0
                focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                ${selectedGender === gender.key ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
              }
            >
              <span className="text-sm sm:text-base transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                {gender.label}
              </span>
            </button>
          ))}
        </div>

        {/* Category Cards for selected gender */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
          {categoryVisibilityLoading ? (
            // Show loading skeleton while fetching category visibility
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 rounded-lg border border-gray-200 bg-gray-50 animate-pulse">
                <div className="mb-1 sm:mb-2 w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
              </div>
            ))
          ) : getFilteredCategories(selectedGender).length > 0 ? (
            getFilteredCategories(selectedGender).map((cat: Category) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex flex-col items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 rounded-lg border border-black bg-white text-black transition-all duration-300 ease-in-out
                  focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2
                  ${selectedCategory === cat.key ? 'shadow-[0_2px_0_0_var(--brand-red)]' : ''}
                  group hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100`
                }
              >
                <span className="mb-1 sm:mb-2 w-8 h-8 sm:w-10 sm:h-10">{cat.icon}</span>
                <span className="text-xs sm:text-sm font-medium transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent text-center">
                  {cat.label}
                </span>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-lg">
                No categories available for {selectedGender === 'men' ? 'men' : selectedGender === 'women' ? 'women' : selectedGender === 'unisex' ? 'unisex' : 'kids'} at the moment.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please check back later or contact support.
              </p>
            </div>
          )}
        </div>

        {/* Add attribution for Icons8 below the categories section */}
        <div className="text-xs text-gray-400 text-center mt-2 mb-4">
          Icons by <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="underline">Icons8</a>
          {categoryVisibility.length === 0 && !categoryVisibilityLoading && (
            <span className="ml-2 text-orange-500">• Using default categories</span>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-red)] focus:border-transparent text-base"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 sm:px-4 py-2 border border-black bg-white text-black rounded-lg transition-all duration-300 ease-in-out group focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] focus-visible:ring-offset-2 hover:scale-105 focus:scale-105 hover:shadow-[0_4px_0_0_var(--brand-red)] focus:shadow-[0_4px_0_0_var(--brand-red)] active:scale-100 flex-1"
              >
                <FaFilter className="mr-2 text-black" />
                <span className="text-sm sm:text-base transition text-black group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">Filters</span>
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-red)] focus:border-transparent text-sm sm:text-base flex-1"
              >
                <option value="bestsellers">Best Sellers</option>
                <option value="price-asc">Lowest Price</option>
                <option value="price-desc">Highest Price</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceRange.min.toString()}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceRange.max?.toString() || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => (
            <Link
              href={`/product/${product._id}`}
              key={product._id}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-gray-100">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                      ShirtHappenZ
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">
                  {product.category}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Color options */}
                <div className="flex items-center mb-3">
                  <span className="text-xs text-gray-500 mr-2">Colors:</span>
                  <div className="flex space-x-1">
                    {product.colors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                        style={{ backgroundColor: color.hexCode }}
                        title={color.name}
                      />
                    ))}
                    {product.colors.length > 5 && (
                      <span className="text-xs text-gray-500 ml-1">
                        +{product.colors.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {product.basePrice > product.price ? (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400 line-through mr-2">
                        RRP: £{product.basePrice.toFixed(2)}
                      </span>
                      <span className="text-sm sm:text-lg font-bold text-green-700">
                        Offer: £{product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-lg font-bold text-purple-600">
                      £{product.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm text-purple-600 group-hover:translate-x-1 transition-transform duration-200 group-hover:bg-gradient-to-r group-hover:from-[var(--brand-red)] group-hover:to-[var(--brand-blue)] group-hover:bg-clip-text group-hover:text-transparent">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products found matching your criteria.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 