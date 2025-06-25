import mongoose, { CallbackError } from 'mongoose';

const supplyOrderSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    supply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supply',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtOrder: {
      type: Number,
      required: true,
      min: 0
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'ordered', 'received', 'cancelled'],
    default: 'draft'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderedBy: {
    type: String,
    required: true
  },
  orderedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Generate reference number before validation
supplyOrderSchema.pre('validate', async function(next) {
  try {
    if (!this.reference) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      // Use this.constructor instead of mongoose.models
      const Model = this.constructor as mongoose.Model<any>;
      const todayCount = await Model.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      const sequence = (todayCount + 1).toString().padStart(4, '0');
      this.reference = `SUP-${year}${month}${day}-${sequence}`;
    }
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Create the model only if it hasn't been registered yet
const SupplyOrder = mongoose.models.SupplyOrder || mongoose.model('SupplyOrder', supplyOrderSchema);

export default SupplyOrder; 