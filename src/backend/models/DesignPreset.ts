import mongoose from 'mongoose';

const designPresetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Preset name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Preset name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  position: {
    x: { type: Number, default: 0, required: true },
    y: { type: Number, default: 0, required: true }
  },
  scale: {
    type: Number,
    default: 100,
    required: true,
    min: [1, 'Scale must be at least 1%'],
    max: [500, 'Scale cannot exceed 500%']
  },
  rotation: {
    type: Number,
    default: 0,
    required: true,
    min: [-360, 'Rotation must be between -360 and 360'],
    max: [360, 'Rotation must be between -360 and 360']
  },
  createdBy: {
    type: String,
    required: [true, 'Creator email is required']
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

// Index for faster lookups
designPresetSchema.index({ name: 1 });
designPresetSchema.index({ createdBy: 1 });

const DesignPreset = mongoose.models.DesignPreset || mongoose.model('DesignPreset', designPresetSchema);

export default DesignPreset;

