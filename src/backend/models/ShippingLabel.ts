import mongoose from 'mongoose';

const ShippingLabelSchema = new mongoose.Schema({
  labelId: {
    type: String,
    required: true,
    unique: true
  },
  shipmentId: {
    type: String,
    required: true
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Ship To Address
  shipTo: {
    name: {
      type: String,
      required: true
    },
    company: String,
    address1: {
      type: String,
      required: true
    },
    address2: String,
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    postcode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'United Kingdom'
    },
    phone: String,
    email: String
  },
  // Ship From Address
  shipFrom: {
    name: {
      type: String,
      required: true
    },
    company: String,
    address1: {
      type: String,
      required: true
    },
    address2: String,
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    postcode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'United Kingdom'
    },
    phone: String
  },
  // Package Details
  package: {
    weight: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['pound', 'ounce', 'gram', 'kilogram'],
        default: 'kilogram'
      }
    },
    dimensions: {
      length: {
        type: Number,
        required: true
      },
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['inch', 'centimeter'],
        default: 'centimeter'
      }
    }
  },
  // Items
  items: [{
    name: {
      type: String,
      required: true
    },
    sku: String,
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['pound', 'ounce', 'gram', 'kilogram'],
        default: 'kilogram'
      }
    },
    unitPrice: Number
  }],
  // ShipEngine Configuration
  shipEngineConfig: {
    carrierId: {
      type: String,
      required: true
    },
    carrierName: String,
    serviceCode: {
      type: String,
      required: true
    },
    serviceName: String,
    labelFormat: {
      type: String,
      enum: ['pdf', 'png', 'zpl'],
      default: 'pdf'
    },
    labelLayout: {
      type: String,
      enum: ['4x6', '4x8', 'letter'],
      default: '4x6'
    },
    labelDownloadType: {
      type: String,
      enum: ['url', 'inline'],
      default: 'url'
    },
    testLabel: {
      type: Boolean,
      default: false
    },
    shipDate: {
      type: Date,
      required: true
    },
    externalShipmentId: String
  },
  // Label Response Data
  labelDownloadUrl: {
    type: String,
    required: true
  },
  labelPngUrl: String,
  labelZplUrl: String,
  shippingCost: {
    amount: Number,
    currency: {
      type: String,
      default: 'GBP'
    }
  },
  insuranceCost: {
    amount: Number,
    currency: {
      type: String,
      default: 'GBP'
    }
  },
  // Status
  status: {
    type: String,
    enum: ['created', 'voided', 'error'],
    default: 'created'
  },
  voided: {
    type: Boolean,
    default: false
  },
  voidedAt: Date,
  // Metadata
  createdBy: {
    type: String,
    required: true
  },
  notes: String,
  orderReference: String, // Optional link to an order
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

// Indexes for faster queries (trackingNumber and labelId already have unique indexes via unique: true)
ShippingLabelSchema.index({ createdAt: -1 });
ShippingLabelSchema.index({ status: 1 });

const ShippingLabel = mongoose.models.ShippingLabel || mongoose.model('ShippingLabel', ShippingLabelSchema);

export default ShippingLabel;

