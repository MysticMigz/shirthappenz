import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number; // percentage (0-100) or fixed amount in pence
  minimumOrderAmount?: number; // in pence
  maximumDiscount?: number; // in pence, for percentage discounts
  usageLimit: number; // total number of times this voucher can be used
  usedCount: number; // how many times it has been used
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  description?: string;
  appliesTo: 'all' | 'specific_products' | 'specific_categories';
  productIds?: string[]; // for specific products
  categoryIds?: string[]; // for specific categories
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  appliesTo: {
    type: String,
    enum: ['all', 'specific_products', 'specific_categories'],
    default: 'all'
  },
  productIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient voucher lookups
voucherSchema.index({ code: 1, isActive: 1 });
voucherSchema.index({ validUntil: 1 });

// Method to check if voucher is valid
voucherSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return (
    this.isActive &&
    this.usedCount < this.usageLimit &&
    now >= this.validFrom &&
    now <= this.validUntil
  );
};

// Method to check if voucher can be applied to an order (using subtotal only)
voucherSchema.methods.canApplyToOrder = function(subtotal: number, items: any[]): boolean {
  if (!this.isValid()) {
    return false;
  }

  // Check minimum subtotal amount (shipping not included)
  if (this.minimumOrderAmount && subtotal < this.minimumOrderAmount) {
    return false;
  }

  // Check if voucher applies to specific products/categories
  if (this.appliesTo !== 'all') {
    const orderProductIds = items.map(item => item.productId);
    const orderCategories = items.map(item => item.category).filter(Boolean);
    
    if (this.appliesTo === 'specific_products') {
      const hasValidProduct = orderProductIds.some(productId => 
        this.productIds?.includes(productId)
      );
      if (!hasValidProduct) return false;
    }
    
    if (this.appliesTo === 'specific_categories') {
      const hasValidCategory = orderCategories.some(category => 
        this.categoryIds?.includes(category)
      );
      if (!hasValidCategory) return false;
    }
  }

  return true;
};

// Method to calculate discount amount (based on subtotal only, not including shipping)
voucherSchema.methods.calculateDiscount = function(subtotal: number): number {
  let discount = 0;

  switch (this.type) {
    case 'percentage':
      discount = (subtotal * this.value) / 100;
      if (this.maximumDiscount) {
        discount = Math.min(discount, this.maximumDiscount);
      }
      break;
    case 'fixed':
      discount = this.value;
      break;
    case 'free_shipping':
      // This will be handled separately in shipping calculation
      discount = 0;
      break;
  }

  return Math.min(discount, subtotal); // Don't discount more than the subtotal
};

// Method to increment usage count
voucherSchema.methods.incrementUsage = function(): void {
  this.usedCount += 1;
};

const Voucher = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', voucherSchema);

export default Voucher; 