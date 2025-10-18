import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';
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

    // Validate minimum order quantity
    const totalQuantity = Object.values(customOrderData.sizeQuantities).reduce((sum: number, colorQuantities: any) => {
      return sum + Object.values(colorQuantities).reduce((sizeSum: number, qty: any) => sizeSum + (qty || 0), 0);
    }, 0);
    if (totalQuantity < 3) {
      return NextResponse.json(
        { error: 'Minimum order quantity is 3 items total across all sizes' },
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
      await sendEmail({
        to: 'admin@mrshirtpersonalisation.co.uk',
        subject: 'New Custom Order Submission',
        html: `
          <h2>New Custom Order Submitted</h2>
          <p><strong>Order ID:</strong> ${result.insertedId}</p>
          <p><strong>Customer:</strong> ${customOrderData.firstName} ${customOrderData.lastName}</p>
          <p><strong>Email:</strong> ${customOrderData.email}</p>
          <p><strong>Phone:</strong> ${customOrderData.phone}</p>
          <p><strong>Company:</strong> ${customOrderData.company || 'N/A'}</p>
          <p><strong>Product:</strong> ${productDetails ? productDetails.name : customOrderData.selectedProduct}</p>
          <p><strong>Total Quantity:</strong> ${totalQuantity}</p>
          <p><strong>Size Breakdown:</strong></p>
          <ul>
            ${Object.entries(customOrderData.sizeQuantities).map(([color, colorQuantities]: [string, any]) => 
              `<li><strong>${color}:</strong> ${Object.entries(colorQuantities).map(([size, qty]: [string, any]) => qty > 0 ? `${size}: ${qty}` : '').filter(Boolean).join(', ') || 'No quantities specified'}</li>`      
            ).join('')}
          </ul>
          <p><strong>Colors:</strong> ${customOrderData.selectedColors.join(', ')}</p>
          <p><strong>Printing Type:</strong> ${customOrderData.printingType}</p>
          <p><strong>Printing Surface:</strong> ${customOrderData.printingSurface}</p>
          <p><strong>Design Location:</strong> ${customOrderData.designLocation}</p>
          <p><strong>Print Size:</strong> ${customOrderData.printSize}</p>
          <p><strong>Design Assistance:</strong> ${customOrderData.needsDesignAssistance ? 'Yes' : 'No'}</p>
          <p><strong>Design Files:</strong> ${designFiles.length > 0 ? designFiles.map(f => f.name).join(', ') : 'No files uploaded'}</p>
          <p><strong>Notes:</strong> ${customOrderData.notes || 'No additional notes'}</p>
          <p><strong>Submitted:</strong> ${customOrderData.submittedAt.toLocaleString()}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: customOrderData.email,
        subject: 'Custom Order Confirmation - ShirtHappenz',
        html: `
          <h2>Thank you for your custom order!</h2>
          <p>Dear ${customOrderData.firstName} ${customOrderData.lastName},</p>
          <p>We have received your custom order request and will contact you within 2 working days to arrange all the details to create the perfect customization for you.</p>
          
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${result.insertedId}</li>
            <li><strong>Product:</strong> ${productDetails ? productDetails.name : customOrderData.selectedProduct}</li>
            <li><strong>Total Quantity:</strong> ${totalQuantity}</li>
            <li><strong>Size Breakdown:</strong>
              <ul>
                ${Object.entries(customOrderData.sizeQuantities).map(([color, colorQuantities]: [string, any]) => 
                  `<li><strong>${color}:</strong> ${Object.entries(colorQuantities).map(([size, qty]: [string, any]) => qty > 0 ? `${size}: ${qty}` : '').filter(Boolean).join(', ') || 'No quantities specified'}</li>`  
                ).join('')}
              </ul>
            </li>
            <li><strong>Colors:</strong> ${customOrderData.selectedColors.join(', ')}</li>
            <li><strong>Printing Type:</strong> ${customOrderData.printingType}</li>
            <li><strong>Printing Surface:</strong> ${customOrderData.printingSurface}</li>
            <li><strong>Design Location:</strong> ${customOrderData.designLocation}</li>
            <li><strong>Print Size:</strong> ${customOrderData.printSize}</li>
            <li><strong>Design Assistance:</strong> ${customOrderData.needsDesignAssistance ? 'Yes' : 'No'}</li>
            <li><strong>Design Files:</strong> ${designFiles.length > 0 ? designFiles.map(f => f.name).join(', ') : 'No files uploaded'}</li>
            <li><strong>Notes:</strong> ${customOrderData.notes || 'No additional notes'}</li>
          </ul>
          
          <p>If you have any questions, please don't hesitate to contact us:</p>
          <ul>
            <li>Email: admin@mrshirtpersonalisation.co.uk</li>
            <li>Phone: +447902870824</li>
            <li>Hours: Monday - Friday 9h-12h and 13h30-16h30</li>
          </ul>
          
          <p>Best regards,<br>The ShirtHappenz Team</p>
        `
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

