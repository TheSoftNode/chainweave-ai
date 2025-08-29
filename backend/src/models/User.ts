import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserPreferences } from '@/types';

// User preferences schema
const userPreferencesSchema = new Schema<UserPreferences>({
  defaultChain: {
    type: Number,
    default: 11155111, // Ethereum Sepolia
  },
  aiStyle: {
    type: String,
    default: 'realistic',
    enum: ['realistic', 'artistic', 'abstract', 'cartoon', 'anime'],
  },
  notifications: {
    type: Boolean,
    default: true,
  },
  publicProfile: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// User schema
const userSchema = new Schema<IUserDocument>({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'],
    index: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'],
  },
  avatar: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  preferences: {
    type: userPreferencesSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Instance methods
userSchema.methods['toJSON'] = function(this: IUserDocument) {
  const userObject = this.toObject();
  delete userObject.__v;
  return userObject;
};

userSchema.methods['updateLastActivity'] = function(this: IUserDocument) {
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
userSchema.statics['findByWallet'] = function(walletAddress: string) {
  return this.findOne({ 
    walletAddress: walletAddress.toLowerCase(),
    isActive: true 
  });
};

userSchema.statics['findByEmail'] = function(email: string) {
  return this.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  });
};

userSchema.statics['findByUsername'] = function(username: string) {
  return this.findOne({ 
    username: username.toLowerCase(),
    isActive: true 
  });
};

userSchema.statics['getActiveUsersCount'] = function() {
  return this.countDocuments({ isActive: true });
};

// Virtual for user stats
userSchema.virtual('stats', {
  ref: 'NFTRequest',
  localField: '_id',
  foreignField: 'userId',
  options: {
    match: { status: 'completed' }
  },
  count: true,
});

// Virtual for user collections
userSchema.virtual('collections', {
  ref: 'Collection',
  localField: '_id',
  foreignField: 'creatorId',
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Normalize wallet address
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  // Normalize email
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase();
  }

  // Normalize username
  if (this.isModified('username') && this.username) {
    this.username = this.username.toLowerCase();
  }

  next();
});

// Post-save middleware for logging
userSchema.post('save', function(doc) {
  console.log(`User ${doc.walletAddress} saved successfully`);
});

// Pre-remove middleware (deprecated, using deleteOne instead)
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // Instead of actually removing, mark as inactive
  this.isActive = false;
  await this.save();
  next();
});

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  toJSON(): IUser;
  updateLastActivity(): Promise<IUserDocument>;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
  findByWallet(walletAddress: string): Promise<IUserDocument | null>;
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByUsername(username: string): Promise<IUserDocument | null>;
  getActiveUsersCount(): Promise<number>;
}

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);