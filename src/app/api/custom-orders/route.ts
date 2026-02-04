import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendCustomOrderAdminNotificationEmail, sendCustomOrderCustomerConfirmationEmail } from '@/lib/email';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const customOrdersCollection = db.collection('customOrders');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Get total count
    const totalCount = await customOrdersCollection.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get orders with pagination
    const orders = await customOrdersCollection
      .find(filter)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const customOrderData = {
      // Contact Information
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      preferredContact: formData.get('preferredContact') as string,
      company: formData.get('company') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postalCode: formData.get('postalCode') as string,
      
      // Customization Information
      selectedProduct: formData.get('selectedProduct') as string,
      quantity: parseInt(formData.get('quantity') as string) || 3,
      sizeQuantities: JSON.parse(formData.get('sizeQuantities') as string || '{}'),
      selectedColors: (formData.get('selectedColors') as string)?.split(',') || [],
      printingType: formData.get('printingType') as string,
      printingSurface: (formData.get('printingSurface') as string)?.split(',') || [],
      designLocation: (formData.get('designLocation') as string)?.split(',') || [],
      printSize: formData.get('printSize') as string,
      paperSize: formData.get('paperSize') as string,
      needsDesignAssistance: formData.get('needsDesignAssistance') === 'true',
      notes: formData.get('notes') as string,
      
      // File handling
      designFiles: [], // Will be populated below
      
      // Metadata
      submittedAt: new Date(),
      status: 'pending'
    };

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'province', 'postalCode', 'selectedProduct'];
    for (const field of requiredFields) {
      if (!customOrderData[field as keyof typeof customOrderData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate printing surface selection
    if (!customOrderData.printingSurface || customOrderData.printingSurface.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one printing surface' },
        { status: 400 }
      );
    }

    // Total quantity (for emails/admin visibility)
    const totalQuantity = Object.values(customOrderData.sizeQuantities).reduce((sum: number, colorQuantities: any) => {
      return sum + Object.values(colorQuantities).reduce((sizeSum: number, qty: any) => sizeSum + (qty || 0), 0);
    }, 0);
    if (totalQuantity < 1) {
      return NextResponse.json(
        { error: 'Please specify quantities for at least one item' },
        { status: 400 }
      );
    }

    // Validate design location selection
    if (!customOrderData.designLocation || customOrderData.designLocation.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one design location' },
        { status: 400 }
      );
    }

    // Validate color selection
    if (!customOrderData.selectedColors || customOrderData.selectedColors.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one color' },
        { status: 400 }
      );
    }

    // Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const customOrdersCollection = db.collection('customOrders');
    const productsCollection = db.collection('products');

    // Fetch product details directly from database
    let productDetails = null;
    try {
      console.log('Fetching product details for ID:', customOrderData.selectedProduct);
      productDetails = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(customOrderData.selectedProduct) });
      console.log('Product details fetched:', productDetails?.name);
      
      if (!productDetails) {
        console.error('Product not found in database');
        return NextResponse.json(
          { error: 'Selected product not found. Please try again.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product details. Please try again.' },
        { status: 500 }
      );
    }

    // Handle multiple file uploads to Cloudinary
    const designFiles: Array<{ name: string; size: number; type: string; url: string; publicId: string }> = [];
    const fileCount = parseInt(formData.get('designFileCount') as string) || 0;
    
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`designFile_${i}`) as File;
      if (file && file.size > 0) {
        try {
          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { 
                folder: 'custom-orders',
                public_id: `design_${Date.now()}_${i}_${file.name.replace(/\.[^/.]+$/, "")}`,
                resource_type: 'auto'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          designFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: (uploadResult as any).secure_url,
            publicId: (uploadResult as any).public_id
          });
        } catch (uploadError) {
          console.error(`Failed to upload file ${file.name}:`, uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Prepare data for database
    const orderToSave = {
      ...customOrderData,
      productDetails: productDetails, // Include full product details
      designFiles: designFiles
    };

    console.log('Saving order with product details:', {
      selectedProduct: customOrderData.selectedProduct,
      productDetails: {
        _id: productDetails._id,
        name: productDetails.name,
        description: productDetails.description,
        price: productDetails.price,
        category: productDetails.category,
        gender: productDetails.gender,
        images: productDetails.images,
        colors: productDetails.colors,
        sizes: productDetails.sizes
      }
    });

    // Save to database
    const result = await customOrdersCollection.insertOne(orderToSave);

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@mrshirtpersonalisation.co.uk';
      const productImageUrl =
        productDetails?.images?.[0]?.url ||
        productDetails?.colors?.find((c: any) => c.imageUrl)?.imageUrl ||
        undefined;

      await sendCustomOrderAdminNotificationEmail({
        to: adminEmail,
        orderId: String(result.insertedId),
        submittedAt: customOrderData.submittedAt,
        customer: {
          firstName: customOrderData.firstName,
          lastName: customOrderData.lastName,
          email: customOrderData.email,
          phone: customOrderData.phone,
          company: customOrderData.company,
          address: customOrderData.address,
          city: customOrderData.city,
          province: customOrderData.province,
          postalCode: customOrderData.postalCode,
          preferredContact: customOrderData.preferredContact,
        },
        product: {
          name: productDetails ? productDetails.name : customOrderData.selectedProduct,
          category: productDetails?.category,
          gender: productDetails?.gender,
          imageUrl: productImageUrl,
        },
        paperSize: customOrderData.paperSize,
        printSize: customOrderData.printSize,
        printingType: customOrderData.printingType,
        printingSurface: customOrderData.printingSurface,
        designLocation: customOrderData.designLocation,
        needsDesignAssistance: customOrderData.needsDesignAssistance,
        notes: customOrderData.notes,
        selectedColors: customOrderData.selectedColors,
        sizeQuantities: customOrderData.sizeQuantities,
        designFiles: designFiles.map((f) => ({ name: f.name, url: f.url })),
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      const productImageUrl =
        productDetails?.images?.[0]?.url ||
        productDetails?.colors?.find((c: any) => c.imageUrl)?.imageUrl ||
        undefined;

      await sendCustomOrderCustomerConfirmationEmail({
        to: customOrderData.email,
        orderId: String(result.insertedId),
        submittedAt: customOrderData.submittedAt,
        firstName: customOrderData.firstName,
        product: {
          name: productDetails ? productDetails.name : customOrderData.selectedProduct,
          imageUrl: productImageUrl,
        },
        paperSize: customOrderData.paperSize,
        printSize: customOrderData.printSize,
        sizeQuantities: customOrderData.sizeQuantities,
        printingSurface: customOrderData.printingSurface,
        designLocation: customOrderData.designLocation,
        notes: customOrderData.notes,
        designFiles: designFiles.map((f) => ({ name: f.name, url: f.url })),
      });
    } catch (emailError) {
      console.error('Failed to send customer confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: result.insertedId,
      message: 'Custom order submitted successfully'
    });

  } catch (error) {
    console.error('Error processing custom order:', error);
    return NextResponse.json(
      { error: 'Failed to process custom order' },
      { status: 500 }
    );
  }
}

