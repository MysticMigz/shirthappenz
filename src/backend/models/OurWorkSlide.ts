import mongoose from 'mongoose';

export interface IOurWorkSlide {
  _id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OurWorkSlideSchema = new mongoose.Schema<IOurWorkSlide>({
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

OurWorkSlideSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.OurWorkSlide || mongoose.model<IOurWorkSlide>('OurWorkSlide', OurWorkSlideSchema);
