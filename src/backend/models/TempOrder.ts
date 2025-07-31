import mongoose from 'mongoose';

const tempOrderSchema = new mongoose.Schema({
  orderDataKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: [{
    productId: String,
    name: String,
    size: String,
    quantity: Number,
    price: Number,
    image: String,
    baseProductName: String,
    baseProductImage: String,
    orderSource: String,
    paperSize: String,
    customization: {
      isCustomized: Boolean,
      designFee: Number,
      frontImage: String,
      frontPosition: {
        x: Number,
        y: Number
      },
      frontScale: Number,
      frontRotation: Number,
      backImage: String,
      backPosition: {
        x: Number,
        y: Number
      },
      backScale: Number,
      backRotation: Number
    }
  }],
  shippingDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    county: String,
    postcode: String,
    shippingMethod: String,
    shippingCost: Number
  },
  visitorId: String,
  userId: String,
  voucherCode: String,
  voucherDiscount: Number,
  voucherType: String,
  voucherValue: Number,
  voucherId: String,
  amount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour
  }
});

export default mongoose.models.TempOrder || mongoose.model('TempOrder', tempOrderSchema); 