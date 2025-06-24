import mongoose from 'mongoose';

const stockAlertSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  currentStock: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

// Index for faster queries
stockAlertSchema.index({ status: 1, createdAt: -1 });

const StockAlert = mongoose.models.StockAlert || mongoose.model('StockAlert', stockAlertSchema);

export default StockAlert; 