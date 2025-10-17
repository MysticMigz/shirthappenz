import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';
import { productSchema, validateAndSanitize } from '@/lib/validation';

interface ProductData {
  name: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string; imageUrl?: string; stock?: { [size: string]: number } }>;
  images: Array<{ url: string; alt: string; color?: string }>;
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
      const colorsData = formData.get('colors') as string;
      console.log('Raw colors data from form:', colorsData);
      
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
        colors: JSON.parse(colorsData || '[]'),
        stock: JSON.parse(formData.get('stock') as string || '{}')
      };
      
      console.log('Parsed colors data:', productData.colors);

      // Handle uploaded images
      const imageFiles = formData.getAll('images') as File[];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          imageFiles.map(async (file, index) => {
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
              const color = formData.get(`imageColors_${index}`) as string;
              
              return {
                url: uploadData.url,
                alt: uploadData.alt || file.name,
                color: color || undefined
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

    // Debug: Log the exact data being validated
    console.log('🔍 Validating product data:', {
      category: productData.category,
      categoryType: typeof productData.category,
      allData: productData
    });

    // Validate and sanitize input using Zod
    const validation = validateAndSanitize(productSchema, productData);
    if (!validation.success) {
      console.error('❌ Product validation failed:', {
        errors: validation.errors,
        productData: {
          name: productData.name,
          category: productData.category,
          gender: productData.gender,
          price: productData.price,
          basePrice: productData.basePrice
        },
        validationSchema: 'Updated schema with crewneck and shortsleeve'
      });
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Combine uploaded images and URL images
    const allImages = [...uploadedImageUrls, ...urlImages];

    // Create product with validated data
    const finalProductData = {
      name: validatedData.name.trim(),
      description: validatedData.description.trim(),
      price: validatedData.price,
      basePrice: validatedData.basePrice,
      category: validatedData.category,
      gender: validatedData.gender,
      sizes: validatedData.sizes,
      colors: validatedData.colors || [],
      images: allImages,
      stock: validatedData.stock,
      featured: validatedData.featured,
      customizable: validatedData.customizable
    };

    console.log('Final product data being saved:', JSON.stringify(finalProductData, null, 2));
    console.log('Colors in final data:', finalProductData.colors);

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