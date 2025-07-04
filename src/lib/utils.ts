import mongoose from 'mongoose';
import Product from '@/backend/models/Product';

export function getImageUrl(path: string): string {
  if (!path) return '';
  
  // If it's an absolute URL or a data URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // If it's a local path starting with /uploads/
  if (path.startsWith('/uploads/')) {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return path;
    }
    // For production
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${path}`;
  }
  
  // If it's a relative path that looks like a timestamp-prefixed filename
  if (/^\d{13}-.*/.test(path)) {
    return `/uploads/${path}`;
  }
  
  // For other local paths, assume they're in the public directory
  return `/${path.replace(/^\//, '')}`;
}

export async function updateProductStock(productId: string, size: string, quantity: number): Promise<boolean> {
  try {
    // Convert string ID to ObjectId if needed
    const _id = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

    // For decreasing stock (quantity is negative), check if we have enough
    if (quantity < 0) {
      const product = await Product.findById(_id);
      if (!product) {
        console.error(`Product not found: ${productId}`);
        return false;
      }

      const available = product.stock[size] || 0;
      if (available < Math.abs(quantity)) {
        console.error(`Insufficient stock for product ${productId}, size ${size}`);
        return false;
      }
    }

    // Use $inc for atomic update
    const updateQuery = {
      $inc: {
        [`stock.${size}`]: quantity
      }
    };

    // Add a condition to prevent stock from going below 0
    const options = {
      new: true,
      runValidators: true
    };

    const product = await Product.findOneAndUpdate(
      {
        _id,
        [`stock.${size}`]: { $gte: Math.abs(quantity) }
      },
      updateQuery,
      options
    );

    if (!product) {
      console.error(`Failed to update stock for product ${productId}, size ${size}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    return false;
  }
} 