import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICollection, CollectionMetadata } from '@/types';

// Collection metadata schema
const collectionMetadataSchema = new Schema<CollectionMetadata>({
  image: {
    type: String,
    trim: true,
  },
  banner: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Invalid website URL'],
  },
  discord: {
    type: String,
    trim: true,
  },
  twitter: {
    type: String,
    trim: true,
    match: [/^@?[\w]+$/, 'Invalid Twitter handle'],
  },
}, { _id: false });

// Collection schema
const collectionSchema = new Schema<ICollectionDocument>({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    minlength: [3, 'Collection name must be at least 3 characters'],
    maxlength: [50, 'Collection name cannot exceed 50 characters'],
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Collection description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  chainId: {
    type: Number,
    required: [true, 'Chain ID is required'],
    index: true,
  },
  contractAddress: {
    type: String,
    required: [true, 'Contract address is required'],
    lowercase: true,
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'],
    unique: true,
    index: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required'],
    index: true,
  },
  totalSupply: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalMinted: {
    type: Number,
    default: 0,
    min: 0,
  },
  royalty: {
    type: Number,
    default: 500, // 5%
    min: 0,
    max: 1000, // 10%
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  metadata: {
    type: collectionMetadataSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Compound indexes
collectionSchema.index({ creatorId: 1, isActive: 1 });
collectionSchema.index({ chainId: 1, isActive: 1 });
collectionSchema.index({ name: 'text', description: 'text' });

// Virtual for NFTs in collection
collectionSchema.virtual('nfts', {
  ref: 'NFTRequest',
  localField: 'contractAddress',
  foreignField: 'blockchainData.contractAddress',
  options: { match: { status: 'completed' } },
});

// Instance methods
collectionSchema.methods['updateSupply'] = function(minted: number, burned: number = 0) {
  this['totalMinted'] += minted;
  this['totalSupply'] = this['totalMinted'] - burned;
  return this['save']();
};

// Static methods
collectionSchema.statics['findByChain'] = function(chainId: number) {
  return this.find({ chainId, isActive: true });
};

collectionSchema.statics['findByCreator'] = function(creatorId: Types.ObjectId) {
  return this.find({ creatorId, isActive: true });
};

export interface ICollectionDocument extends Omit<ICollection, '_id'>, Document {
  updateSupply(minted: number, burned?: number): Promise<ICollectionDocument>;
}

export interface ICollectionModel extends mongoose.Model<ICollectionDocument> {
  findByChain(chainId: number): Promise<ICollectionDocument[]>;
  findByCreator(creatorId: Types.ObjectId): Promise<ICollectionDocument[]>;
}

export const Collection = mongoose.model<ICollectionDocument, ICollectionModel>('Collection', collectionSchema);