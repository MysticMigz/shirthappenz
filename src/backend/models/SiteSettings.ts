import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  description: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: String,
    required: [true, 'Admin user who updated this setting is required']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique keys
siteSettingsSchema.index({ key: 1 }, { unique: true });

const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);

export default SiteSettings;

