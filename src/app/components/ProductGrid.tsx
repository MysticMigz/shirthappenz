import Link from 'next/link';

const ProductGrid = () => {
  const products = [
    {
      id: 1,
      name: "Softstyle T-Shirt",
      category: "Adult/Design Online/Mens/T-Shirts/Unisex",
      price: "From £10.00",
      image: "/api/placeholder/300/300",
      description: "Comfortable and versatile",
      colors: ["white", "black", "navy", "red", "purple"]
    },
    {
      id: 2,
      name: "Basic T-Shirt",
      category: "Adult/Design Online/Mens/T-Shirts/Unisex",
      price: "From £7.00",
      image: "/api/placeholder/300/300",
      description: "Essential everyday wear",
      colors: ["white", "black", "gray", "blue"]
    },
    {
      id: 3,
      name: "Iconic Mens T-shirt",
      category: "Adult/Design Online/Mens/T-Shirts",
      price: "From £9.50",
      image: "/api/placeholder/300/300",
      description: "Premium quality fit",
      colors: ["white", "black", "navy", "charcoal"]
    },
    {
      id: 4,
      name: "Iconic Ladies T-shirt",
      category: "Adult/Design Online/Ladies/T-Shirts",
      price: "From £9.50",
      image: "/api/placeholder/300/300",
      description: "Flattering feminine cut",
      colors: ["white", "black", "pink", "purple"]
    },
    {
      id: 5,
      name: "Heavy Long Sleeve T-Shirt",
      category: "Adult/Design Online/Mens/T-Shirts",
      price: "From £15.00",
      image: "/api/placeholder/300/300",
      description: "Durable long-sleeve option",
      colors: ["white", "black", "navy", "gray"]
    },
    {
      id: 6,
      name: "Premium Hoodie",
      category: "Adult/Design Online/Hoodies",
      price: "From £29.00",
      image: "/api/placeholder/300/300",
      description: "Cozy and warm",
      colors: ["white", "black", "navy", "purple", "red"]
    },
    {
      id: 7,
      name: "Ladies Premium T-shirt",
      category: "Adult/Design Online/Ladies/T-Shirts",
      price: "From £11.00",
      image: "/api/placeholder/300/300",
      description: "Soft ringspun cotton",
      colors: ["white", "black", "pink", "purple", "blue"]
    },
    {
      id: 8,
      name: "Tri-Blend T-shirt",
      category: "Adult/Design Online/Sports & Activewear/T-Shirts/Unisex",
      price: "From £10.00",
      image: "/api/placeholder/300/300",
      description: "Ultra-soft blend fabric",
      colors: ["gray", "navy", "charcoal", "purple"]
    },
    {
      id: 9,
      name: "Organic Classic T-shirt",
      category: "Adult/Design Online/Organic & Sustainable/T-Shirts/Unisex",
      price: "From £10.50",
      image: "/api/placeholder/300/300",
      description: "Eco-friendly organic cotton",
      colors: ["white", "black", "natural", "gray"]
    },
    {
      id: 10,
      name: "Organic Essential Lady Fit",
      category: "Adult/Design Online/Ladies/Organic & Sustainable/T-Shirts",
      price: "From £10.50",
      image: "/api/placeholder/300/300",
      description: "Sustainable women's tee",
      colors: ["white", "black", "natural", "purple"]
    }
  ];

  const getColorDot = (color: string) => {
    const colorMap: { [key: string]: string } = {
      white: 'bg-white border-2 border-gray-300',
      black: 'bg-black',
      navy: 'bg-navy-800',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      pink: 'bg-pink-500',
      charcoal: 'bg-gray-700',
      natural: 'bg-yellow-100 border-2 border-yellow-200'
    };
    return colorMap[color] || 'bg-gray-300';
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Design your own printed t-shirt online
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We have taken the best products from our catalogue and created a facility where you can 
            personalise your printed t-shirts and order them instantly online. These products can be 
            produced quickly, often within a 3-5 working day turnaround.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden group"
            >
              <div className="relative aspect-square bg-gray-100">
                {/* Placeholder for product image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-lg px-4 py-2 rounded-lg">
                    ShirtHappenZ
                  </div>
                </div>
                
                {/* Quick design button overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    href={`/design?product=${product.id}`}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Design Now
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {product.category}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {product.description}
                </p>
                
                {/* Color options */}
                <div className="flex items-center mb-3">
                  <span className="text-xs text-gray-500 mr-2">Colors:</span>
                  <div className="flex space-x-1">
                    {product.colors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${getColorDot(color)}`}
                        title={color}
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
                  <span className="text-lg font-bold text-purple-600">
                    {product.price}
                  </span>
                  <Link
                    href={`/product/${product.id}`}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid; 