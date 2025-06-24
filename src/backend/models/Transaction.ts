import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'GBP'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    sparse: true // Stripe payment intent ID
  },
  paypalOrderId: {
    type: String,
    sparse: true // PayPal order ID
  },
  refundId: {
    type: String,
    sparse: true // For refund reference
  },
  errorMessage: {
    type: String,
    sparse: true // Store any error messages
  },
  metadata: {
    type: Map,
    of: String,
    default: {} // Additional transaction data
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction; 