import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

interface ProductData {
  name: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  images: Array<{ url: string; alt: string }>;
  stock: { [key: string]: number };
  featured?: boolean;
  customizable?: boolean;
  gender: string;
}

// Get all products
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    
    // Build query
    const query: any = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
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

// Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    let productData: any = {};
    let uploadedImageUrls: Array<{ url: string; alt: string }> = [];
    let urlImages: Array<{ url: string; alt: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file uploads and URL images
      const formData = await request.formData();
      
      // Extract basic product data
      productData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        basePrice: Number(formData.get('basePrice')),
        category: formData.get('category') as string,
        gender: formData.get('gender') as string,
        featured: formData.get('featured') === 'true',
        customizable: formData.get('customizable') === 'true',
        sizes: JSON.parse(formData.get('sizes') as string || '[]'),
        colors: JSON.parse(formData.get('colors') as string || '[]'),
        stock: JSON.parse(formData.get('stock') as string || '{}')
      };

      // Handle uploaded images
      const imageFiles = formData.getAll('images') as File[];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          imageFiles.map(async (file) => {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            try {
              const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload`, {
                method: 'POST',
                body: uploadFormData,
              });

              if (!uploadResponse.ok) {
                throw new Error(`Failed to upload ${file.name}`);
              }

              const uploadData = await uploadResponse.json();
              return {
                url: uploadData.url,
                alt: uploadData.alt || file.name
              };
            } catch (error) {
              console.error(`Error uploading ${file.name}:`, error);
              throw new Error(`Failed to upload ${file.name}`);
            }
          })
        );
      }

      // Handle URL images
      const urlImagesData = formData.get('urlImages');
      if (urlImagesData) {
        urlImages = JSON.parse(urlImagesData as string);
      }
    } else {
      // Handle JSON data (fallback for existing functionality)
      productData = await request.json();
      uploadedImageUrls = productData.images || [];
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.price || !productData.category || !productData.basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate stock data
    if (typeof productData.stock !== 'object' || productData.stock === null) {
      return NextResponse.json(
        { error: 'Invalid stock data format' },
        { status: 400 }
      );
    }

    // Ensure all stock quantities are non-negative integers
    for (const [size, quantity] of Object.entries(productData.stock)) {
      const numQuantity = Number(quantity);
      if (!Number.isInteger(numQuantity) || numQuantity < 0) {
        return NextResponse.json(
          { error: `Invalid stock quantity for size ${size}. Must be a non-negative integer.` },
          { status: 400 }
        );
      }
    }

    // Combine uploaded images and URL images
    const allImages = [...uploadedImageUrls, ...urlImages];

    // Create product with properly formatted data
    const finalProductData = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: Number(productData.price),
      basePrice: Number(productData.basePrice),
      category: productData.category,
      gender: productData.gender,
      sizes: Array.isArray(productData.sizes) ? productData.sizes : [],
      colors: Array.isArray(productData.colors) ? productData.colors : [],
      images: allImages,
      stock: productData.stock,
      featured: Boolean(productData.featured),
      customizable: productData.customizable ?? true
    };

    const product = await Product.create(finalProductData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
} 