import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';
import Collection from '@/backend/models/Collection';
import { productSchema, validateAndSanitize } from '@/lib/validation';

// Force dynamic rendering - this route uses getServerSession() which accesses headers
export const dynamic = 'force-dynamic';

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
  jerseyCustomOrderOnly?: boolean;
  gender: string;
}

// Get all products
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ [Products API] No session or email');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 [Products API] Session found:', { email: session.user.email, isAdmin: session.user.isAdmin });

    try {
      await connectToDatabase();
      console.log('✅ [Products API] Database connected');
    } catch (dbError) {
      console.error('❌ [Products API] Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Verify admin status
    let user;
    try {
      user = await (User as any).findOne({ email: session.user.email });
      if (!user) {
        console.error('❌ [Products API] User not found:', session.user.email);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      if (!user.isAdmin) {
        console.error('❌ [Products API] User is not admin:', session.user.email);
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      console.log('✅ [Products API] Admin verified');
    } catch (userError) {
      console.error('❌ [Products API] Error verifying user:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user', details: userError instanceof Error ? userError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    
    console.log('🔍 [Products API] Query params:', { page, limit, search, category });
    
    // Build query - use regex search by default (more reliable, doesn't require text index)
    const query: any = {};
    if (search) {
      // Use regex search which works without requiring a text index
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    let products;
    let total;
    
    try {
      // Try with populate first
      try {
        products = await (Product as any).find(query)
          .populate('collections', 'name slug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await (Product as any).countDocuments(query);
      } catch (populateError) {
        // If populate fails, try without it
        console.warn('⚠️ [Products API] Populate failed, fetching without collections:', populateError);
        products = await (Product as any).find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
        total = await (Product as any).countDocuments(query);
      }
      
      console.log('✅ [Products API] Products fetched:', { count: products.length, total });
      
      return NextResponse.json({
        products,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (queryError) {
      console.error('❌ [Products API] Query execution failed:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('❌ [Products API] Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ [Products API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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
    const user = await (User as any).findOne({ email: session.user.email });
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
        productDetails: formData.get('productDetails') as string || '',
        price: Number(formData.get('price')),
        basePrice: Number(formData.get('basePrice')),
        category: formData.get('category') as string,
        gender: formData.get('gender') as string,
        featured: formData.get('featured') === 'true',
        customizable: formData.get('customizable') === 'true',
        jerseyCustomOrderOnly: formData.get('jerseyCustomOrderOnly') === 'true',
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
              const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://mrshirtpersonalisation.co.uk'}/api/upload`, {
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

      // Handle mockup image
      let mockupImageData: { url: string; alt: string } | undefined;
      const mockupImageFile = formData.get('mockupImage') as File | null;
      if (mockupImageFile && mockupImageFile.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', mockupImageFile);
        const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://mrshirtpersonalisation.co.uk'}/api/upload`, {
          method: 'POST',
          body: uploadFormData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mockupImageData = {
            url: uploadData.url,
            alt: (formData.get('mockupImageAlt') as string) || 'Product mockup'
          };
        }
      } else {
        const mockupImageUrl = formData.get('mockupImageUrl') as string;
        if (mockupImageUrl) {
          mockupImageData = {
            url: mockupImageUrl,
            alt: (formData.get('mockupImageAlt') as string) || 'Product mockup'
          };
        }
      }

      // Handle design image
      let designImageData: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number } | undefined;
      const designImageFile = formData.get('designImage') as File | null;
      if (designImageFile && designImageFile.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', designImageFile);
        const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://mrshirtpersonalisation.co.uk'}/api/upload`, {
          method: 'POST',
          body: uploadFormData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          designImageData = {
            url: uploadData.url,
            alt: (formData.get('designImageAlt') as string) || 'Product design',
            position: {
              x: parseFloat((formData.get('designPositionX') as string) || '0'),
              y: parseFloat((formData.get('designPositionY') as string) || '0')
            },
            scale: parseFloat((formData.get('designScale') as string) || '100'),
            rotation: parseFloat((formData.get('designRotation') as string) || '0')
          };
        }
      } else {
        const designImageUrl = formData.get('designImageUrl') as string;
        if (designImageUrl) {
          designImageData = {
            url: designImageUrl,
            alt: (formData.get('designImageAlt') as string) || 'Product design',
            position: {
              x: parseFloat((formData.get('designPositionX') as string) || '0'),
              y: parseFloat((formData.get('designPositionY') as string) || '0')
            },
            scale: parseFloat((formData.get('designScale') as string) || '100'),
            rotation: parseFloat((formData.get('designRotation') as string) || '0')
          };
        }
      }

      // Handle multiple combinations
      const combinationsData = formData.get('combinations') as string;
      let mockupDesignCombinations: Array<{
        mockupImage: { url: string; alt: string };
        designImage: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number };
        name?: string;
        order?: number;
      }> = [];

      if (combinationsData) {
        try {
          const combinationsInfo = JSON.parse(combinationsData);
          
          // Process each combination
          for (let i = 0; i < combinationsInfo.length; i++) {
            const comboInfo = combinationsInfo[i];
            let comboMockupImage: { url: string; alt: string } | undefined;
            let comboDesignImage: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number } | undefined;

            // Handle mockup image for this combination
            const comboMockupFile = formData.get(`combination_${i}_mockup`) as File | null;
            if (comboMockupFile && comboMockupFile.size > 0) {
              const uploadFormData = new FormData();
              uploadFormData.append('file', comboMockupFile);
              const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://mrshirtpersonalisation.co.uk'}/api/upload`, {
                method: 'POST',
                body: uploadFormData,
              });
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                comboMockupImage = {
                  url: uploadData.url,
                  alt: (formData.get(`combination_${i}_mockupAlt`) as string) || `Mockup ${i + 1}`
                };
              }
            } else {
              const comboMockupUrl = formData.get(`combination_${i}_mockupUrl`) as string || comboInfo.mockupUrl;
              if (comboMockupUrl) {
                comboMockupImage = {
                  url: comboMockupUrl,
                  alt: (formData.get(`combination_${i}_mockupAlt`) as string) || comboInfo.mockupAlt || `Mockup ${i + 1}`
                };
              }
            }

            // Handle design image for this combination
            const comboDesignFile = formData.get(`combination_${i}_design`) as File | null;
            if (comboDesignFile && comboDesignFile.size > 0) {
              const uploadFormData = new FormData();
              uploadFormData.append('file', comboDesignFile);
              const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://mrshirtpersonalisation.co.uk'}/api/upload`, {
                method: 'POST',
                body: uploadFormData,
              });
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                comboDesignImage = {
                  url: uploadData.url,
                  alt: (formData.get(`combination_${i}_designAlt`) as string) || `Design ${i + 1}`,
                  position: {
                    x: parseFloat((formData.get(`combination_${i}_positionX`) as string) || '0'),
                    y: parseFloat((formData.get(`combination_${i}_positionY`) as string) || '0')
                  },
                  scale: parseFloat((formData.get(`combination_${i}_scale`) as string) || '100'),
                  rotation: parseFloat((formData.get(`combination_${i}_rotation`) as string) || '0')
                };
              }
            } else {
              const comboDesignUrl = formData.get(`combination_${i}_designUrl`) as string || comboInfo.designUrl;
              if (comboDesignUrl) {
                comboDesignImage = {
                  url: comboDesignUrl,
                  alt: (formData.get(`combination_${i}_designAlt`) as string) || comboInfo.designAlt || `Design ${i + 1}`,
                  position: {
                    x: parseFloat((formData.get(`combination_${i}_positionX`) as string) || comboInfo.position?.x?.toString() || '0'),
                    y: parseFloat((formData.get(`combination_${i}_positionY`) as string) || comboInfo.position?.y?.toString() || '0')
                  },
                  scale: parseFloat((formData.get(`combination_${i}_scale`) as string) || comboInfo.scale?.toString() || '100'),
                  rotation: parseFloat((formData.get(`combination_${i}_rotation`) as string) || comboInfo.rotation?.toString() || '0')
                };
              }
            }

            // Only add combination if both images are present
            if (comboMockupImage && comboDesignImage) {
              mockupDesignCombinations.push({
                mockupImage: comboMockupImage,
                designImage: comboDesignImage,
                name: (formData.get(`combination_${i}_name`) as string) || comboInfo.name || undefined,
                order: parseInt((formData.get(`combination_${i}_order`) as string) || comboInfo.order?.toString() || i.toString())
              });
            }
          }
        } catch (error) {
          console.error('Error parsing combinations data:', error);
        }
      }

      // Add mockup and design images to product data (legacy support)
      if (mockupImageData) {
        productData.mockupImage = mockupImageData;
      }
      if (designImageData) {
        productData.designImage = designImageData;
      }
      
      // Add combinations array
      if (mockupDesignCombinations.length > 0) {
        productData.mockupDesignCombinations = mockupDesignCombinations;
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
        errors: (validation as any).errors,
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
        { error: (validation as any).errors[0] },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Combine uploaded images and URL images
    const allImages = [...uploadedImageUrls, ...urlImages];

    // Create product with validated data (jerseyCustomOrderOnly already normalized in productSchema transform)
    const finalProductData: any = {
      name: validatedData.name.trim(),
      description: validatedData.description.trim(),
      productDetails: validatedData.productDetails || '',
      price: validatedData.price,
      basePrice: validatedData.basePrice,
      category: validatedData.category,
      gender: validatedData.gender,
      sizes: validatedData.sizes,
      colors: validatedData.colors || [],
      images: allImages,
      stock: validatedData.stock,
      featured: validatedData.featured,
      customizable: validatedData.customizable,
      jerseyCustomOrderOnly: validatedData.jerseyCustomOrderOnly,
    };

    // Add mockup and design images if they exist (legacy)
    if (productData.mockupImage) {
      finalProductData.mockupImage = productData.mockupImage;
    }
    if (productData.designImage) {
      finalProductData.designImage = productData.designImage;
    }
    
    // Add combinations array
    if (productData.mockupDesignCombinations && productData.mockupDesignCombinations.length > 0) {
      finalProductData.mockupDesignCombinations = productData.mockupDesignCombinations;
    }

    console.log('Final product data being saved:', JSON.stringify(finalProductData, null, 2));
    console.log('Colors in final data:', finalProductData.colors);

    const product = await (Product as any).create(finalProductData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
} 