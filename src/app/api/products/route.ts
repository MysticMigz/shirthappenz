import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/backend/models/Product';
import Order from '@/backend/models/Order';
import { productSchema, validateAndSanitize } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Best Sellers logic
    if (sortBy === 'bestsellers') {
      // Aggregate order items to count sales per productId
      const sales = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', salesCount: { $sum: '$items.quantity' } } },
        { $sort: { salesCount: -1 } }
      ]);
      const salesMap = Object.fromEntries(sales.map(s => [s._id, s.salesCount]));
      // Fetch all products matching query
      const products = await Product.find(query);
      // Attach salesCount to each product (default 0)
      const productsWithSales = products.map(p => ({
        ...p.toObject(),
        salesCount: salesMap[p._id.toString()] || 0
      }));
      // Sort by salesCount desc
      productsWithSales.sort((a, b) => b.salesCount - a.salesCount);
      // Paginate
      const paginated = productsWithSales.slice((page - 1) * limit, page * limit);
      return NextResponse.json({
        products: paginated,
        pagination: {
          total: productsWithSales.length,
          pages: Math.ceil(productsWithSales.length / limit),
          page,
          limit
        }
      });
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Fetch products
    let sort: any = { createdAt: -1 };
    if (sortBy === 'price-asc') sort = { basePrice: 1 };
    if (sortBy === 'price-desc') sort = { basePrice: -1 };
    if (sortBy === 'name-asc') sort = { name: 1 };
    if (sortBy === 'name-desc') sort = { name: -1 };

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // Format image URLs
    const formattedProducts = products.map(product => product.toObject());
    
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        pages: totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Validate and sanitize input using Zod
    const validation = validateAndSanitize(productSchema, data);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    const product = await Product.create(validatedData);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 