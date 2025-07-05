import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  items: [{
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
      required: true,
    },
    color: String,
    image: String,
    customization: {
      name: String,
      number: String,
      isCustomized: {
        type: Boolean,
        default: false
      },
      nameCharacters: Number,
      numberCharacters: Number,
      customizationCost: Number
    }
  }],
  shippingDetails: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      required: true,
    },
    county: {
      type: String,
      required: true,
    },
    postcode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'United Kingdom',
    },
    shippingMethod: {
      type: String,
      required: true,
      enum: ['Standard Delivery', 'Express Delivery', 'Next Day Delivery']
    },
    shippingCost: {
      type: Number,
      required: true
    },
    estimatedDeliveryDays: String
  },
  total: {
    type: Number,
    required: true,
  },
  vat: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed'],
    default: 'pending',
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Function to generate a reference number
async function generateReference(doc: any) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get the count of orders for today to use as a sequence number
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const Order = doc.constructor as mongoose.Model<any>;
  const count = await Order.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  });

  // Format: SH-YYMMDD-XXXX where XXXX is the sequential number for the day
  const sequence = (count + 1).toString().padStart(4, '0');
  return `SH-${year}${month}${day}-${sequence}`;
}

// Generate reference number before saving
OrderSchema.pre('save', async function(next) {
  try {
    if (!this.reference) {
      // Generate and assign the reference
      this.reference = await generateReference(this);
      
      // Verify uniqueness
      const Order = this.constructor as mongoose.Model<any>;
      const exists = await Order.findOne({ reference: this.reference });
      
      if (exists) {
        // In the unlikely event of a collision, try again with a random number
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.reference = `SH-${this.reference.slice(3, 9)}-${random}`;
        
        // Double-check the random reference is unique
        const randomExists = await Order.findOne({ reference: this.reference });
        if (randomExists) {
          throw new Error('Could not generate unique reference');
        }
      }
    }
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Failed to generate reference'));
  }
});

// Create or get the model
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order; 