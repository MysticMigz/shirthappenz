import mongoose from 'mongoose';

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      maxlength: [60, 'Name cannot be more than 60 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxlength: [200, 'Description cannot be more than 200 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Please provide a product category'],
      enum: ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Polo Shirts']
    },
    image: {
      type: String,
      required: [true, 'Please provide a product image URL']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema); 