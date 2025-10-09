import mongoose from 'mongoose';

export interface ICarouselBackground {
  _id?: string;
  slideId: number; // Specific slide number (1-5)
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string; // Optional - if not provided, uses gradient
  bgGradient: string; // Fallback gradient
  textColor: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CarouselBackgroundSchema = new mongoose.Schema<ICarouselBackground>({
  slideId: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subtitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  buttonText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  buttonLink: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  imageUrl: {
    type: String,
    trim: true
  },
  bgGradient: {
    type: String,
    required: true,
    trim: true
  },
  textColor: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
CarouselBackgroundSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.CarouselBackground || mongoose.model<ICarouselBackground>('CarouselBackground', CarouselBackgroundSchema);
