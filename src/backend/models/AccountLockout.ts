import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountLockout extends Document {
  email: string;
  ip: string;
  failedAttempts: number;
  lockedUntil: Date;
  lastAttempt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const accountLockoutSchema = new Schema<IAccountLockout>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  ip: {
    type: String,
    required: true,
    index: true
  },
  failedAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for email and IP
accountLockoutSchema.index({ email: 1, ip: 1 });

// Method to check if account is locked
accountLockoutSchema.methods.isLocked = function(): boolean {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

// Method to increment failed attempts
accountLockoutSchema.methods.incrementFailedAttempts = function(): void {
  this.failedAttempts += 1;
  this.lastAttempt = new Date();
  
  // Lock account after 5 failed attempts
  if (this.failedAttempts >= 5) {
    // Lock for 15 minutes
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
};

// Method to reset failed attempts
accountLockoutSchema.methods.resetFailedAttempts = function(): void {
  this.failedAttempts = 0;
  this.lockedUntil = null;
  this.lastAttempt = new Date();
};

const AccountLockout = mongoose.models.AccountLockout || mongoose.model<IAccountLockout>('AccountLockout', accountLockoutSchema);

export default AccountLockout; 