import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import { requireAdmin } from '@/backend/utils/auth';
import Product from '@/backend/models/Product';
import StockAlert from '@/backend/models/StockAlert';

const LOW_STOCK_THRESHOLD = 5;

interface StockData {
  [size: string]: number;
}

// Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate barcode data if present
    if (data.barcodes && Array.isArray(data.barcodes)) {
      for (let i = 0; i < data.barcodes.length; i++) {
        const barcode = data.barcodes[i];
        if (!barcode.colorName || barcode.colorName.trim() === '') {
          return NextResponse.json(
            { error: `Barcode ${i + 1}: colorName is required and cannot be empty` },
            { status: 400 }
          );
        }
        if (!barcode.colorHex || barcode.colorHex.trim() === '') {
          return NextResponse.json(
            { error: `Barcode ${i + 1}: colorHex is required and cannot be empty` },
            { status: 400 }
          );
        }
        if (!barcode.value || barcode.value.trim() === '') {
          return NextResponse.json(
            { error: `Barcode ${i + 1}: value is required and cannot be empty` },
            { status: 400 }
          );
        }
        if (!barcode.size || barcode.size.trim() === '') {
          return NextResponse.json(
            { error: `Barcode ${i + 1}: size is required and cannot be empty` },
            { status: 400 }
          );
        }
        if (!barcode.sizeCode || barcode.sizeCode.trim() === '') {
          return NextResponse.json(
            { error: `Barcode ${i + 1}: sizeCode is required and cannot be empty` },
            { status: 400 }
          );
        }
      }
    }
    
    // If only updating stock, skip other validations
    if (Object.keys(data).length === 1 && data.stock) {
      // Validate stock data
      if (typeof data.stock !== 'object' || data.stock === null) {
        return NextResponse.json(
          { error: 'Invalid stock data format' },
          { status: 400 }
        );
      }

      const stockData = data.stock as StockData;

      // Ensure all stock quantities are non-negative integers
      for (const [size, quantity] of Object.entries(stockData)) {
        if (!Number.isInteger(quantity) || quantity < 0) {
          return NextResponse.json(
            { error: `Invalid stock quantity for size ${size}. Must be a non-negative integer.` },
            { status: 400 }
          );
        }
      }

      // Get current product data
      const currentProduct = await Product.findById(params.id);
      if (!currentProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Check for low stock and create alerts
      for (const [size, quantity] of Object.entries(stockData)) {
        if (quantity <= LOW_STOCK_THRESHOLD) {
          // Check if there's already an active alert for this product and size
          const existingAlert = await StockAlert.findOne({
            productId: params.id,
            size,
            status: 'active'
          });

          if (!existingAlert) {
            await StockAlert.create({
              productId: params.id,
              productName: currentProduct.name,
              size,
              currentStock: quantity,
              status: 'active'
            });
          } else if (existingAlert.currentStock !== quantity) {
            // Update existing alert with new stock level
            existingAlert.currentStock = quantity;
            await existingAlert.save();
          }
        } else {
          // If stock is now above threshold, resolve any existing alerts
          await StockAlert.updateMany(
            {
              productId: params.id,
              size,
              status: 'active'
            },
            {
              status: 'resolved',
              resolvedAt: new Date()
            }
          );
        }
      }
    } else {
      // Validate required fields for full updates
      // If only updating barcode, allow it
      if (
        (Object.keys(data).length === 1 && data.barcode) ||
        (Object.keys(data).length === 1 && data.barcodes)
      ) {
        // No required fields check needed
      } else {
        const requiredFields = ['name', 'description', 'price', 'category', 'basePrice', 'gender'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const product = await Product.findByIdAndDelete(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 