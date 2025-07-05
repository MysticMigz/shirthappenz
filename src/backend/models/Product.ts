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
    enum: {
      values: [
        'tshirts',
        'jerseys',
        'tanktops',
        'longsleeve',
        'hoodies',
        'sweatshirts',
        'sweatpants',
        'accessories'
      ],
      message: '{VALUE} is not a valid category'
    }
  },
  gender: {
    type: String,
    required: [true, 'Product gender is required'],
    enum: {
      values: ['men', 'women', 'unisex'],
      message: '{VALUE} is not a valid gender'
    }
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
    type: Object,
    default: {},
    validate: {
      validator: function(value: any) {
        if (typeof value !== 'object' || value === null) {
          return false;
        }
        return Object.values(value).every(qty => 
          typeof qty === 'number' && qty >= 0 && Number.isInteger(qty)
        );
      },
      message: 'Stock quantities must be non-negative integers'
    }
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
productSchema.methods.checkStock = function(size: string, quantity: number) {
  const available = this.stock[size] || 0;
  return available >= quantity;
};

// Method to update stock
productSchema.methods.updateStock = function(size: string, quantity: number) {
  const currentStock = this.stock[size] || 0;
  this.stock[size] = currentStock + quantity;
  return this.save();
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 