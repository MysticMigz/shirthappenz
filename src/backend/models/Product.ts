import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: String,
    alt: String
  }],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['t-shirts', 'hoodies', 'sweatshirts', 'accessories']
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
  }],
  colors: [{
    name: String,
    hexCode: String
  }],
  stock: {
    type: Map,
    of: {
      type: Map,
      of: Number // stock[color][size] = quantity
    },
    default: new Map()
  },
  featured: {
    type: Boolean,
    default: false
  },
  customizable: {
    type: Boolean,
    default: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required for customizable products']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Method to check stock availability
productSchema.methods.checkStock = function(color: string, size: string, quantity: number) {
  const available = this.stock.get(color)?.get(size) || 0;
  return available >= quantity;
};

// Method to update stock
productSchema.methods.updateStock = function(color: string, size: string, quantity: number) {
  if (!this.stock.has(color)) {
    this.stock.set(color, new Map());
  }
  const currentStock = this.stock.get(color).get(size) || 0;
  this.stock.get(color).set(size, currentStock + quantity);
  return this.save();
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 