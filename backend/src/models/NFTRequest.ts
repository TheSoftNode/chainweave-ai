import mongoose, { Schema, Document, Types } from 'mongoose';
import { INFTRequest, RequestStatus, AIGenerationData, BlockchainData, NFTMetadata } from '@/types';

// AI Generation Data schema
const aiGenerationDataSchema = new Schema<AIGenerationData>({
  model: {
    type: String,
    required: true,
    default: 'gemini-pro',
  },
  generatedImageUrl: {
    type: String,
    trim: true,
  },
  ipfsHash: {
    type: String,
    trim: true,
  },
  tokenURI: {
    type: String,
    trim: true,
  },
  processingTime: {
    type: Number,
    min: 0,
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },
}, { _id: false });

// Blockchain Data schema
const blockchainDataSchema = new Schema<BlockchainData>({
  transactionHash: {
    type: String,
    trim: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
  },
  tokenId: {
    type: Number,
    min: 0,
  },
  contractAddress: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format'],
  },
  gasUsed: {
    type: Number,
    min: 0,
  },
  blockNumber: {
    type: Number,
    min: 0,
  },
  confirmations: {
    type: Number,
    min: 0,
    default: 0,
  },
}, { _id: false });

// NFT Metadata schema
const nftMetadataSchema = new Schema<NFTMetadata>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'NFT name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  attributes: [{
    trait_type: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  }],
  external_url: {
    type: String,
    trim: true,
  },
  animation_url: {
    type: String,
    trim: true,
  },
}, { _id: false });

// NFT Request schema
const nftRequestSchema = new Schema<INFTRequestDocument>({
  requestId: {
    type: String,
    required: [true, 'Request ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    lowercase: true,
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'],
    index: true,
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true,
    minlength: [10, 'Prompt must be at least 10 characters'],
    maxlength: [500, 'Prompt cannot exceed 500 characters'],
  },
  destinationChainId: {
    type: Number,
    required: [true, 'Destination chain ID is required'],
    index: true,
  },
  recipient: {
    type: String,
    required: [true, 'Recipient is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
    required: true,
    index: true,
  },
  fee: {
    type: Number,
    min: 0,
    default: 0,
  },
  aiGenerationData: {
    type: aiGenerationDataSchema,
    default: undefined,
  },
  blockchainData: {
    type: blockchainDataSchema,
    default: undefined,
  },
  metadata: {
    type: nftMetadataSchema,
    default: undefined,
  },
  completedAt: {
    type: Date,
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Error message cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Compound indexes for better query performance
nftRequestSchema.index({ userId: 1, status: 1 });
nftRequestSchema.index({ walletAddress: 1, createdAt: -1 });
nftRequestSchema.index({ destinationChainId: 1, status: 1 });
nftRequestSchema.index({ status: 1, createdAt: -1 });
nftRequestSchema.index({ requestId: 1, status: 1 });

// Text search index for prompt
nftRequestSchema.index({ prompt: 'text' });

// Instance methods
nftRequestSchema.methods['toJSON'] = function(this: INFTRequestDocument) {
  const requestObject = this.toObject();
  delete requestObject.__v;
  return requestObject;
};

nftRequestSchema.methods['updateStatus'] = function(this: INFTRequestDocument, status: RequestStatus, errorMessage?: string) {
  this.status = status;
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  if (status === RequestStatus.COMPLETED) {
    this.completedAt = new Date();
  }
  this.updatedAt = new Date();
  return this.save();
};

nftRequestSchema.methods['setAIGenerationData'] = function(this: INFTRequestDocument, data: Partial<AIGenerationData>) {
  if (!this.aiGenerationData) {
    this.aiGenerationData = {} as AIGenerationData;
  }
  Object.assign(this.aiGenerationData, data);
  return this.save();
};

nftRequestSchema.methods['setBlockchainData'] = function(this: INFTRequestDocument, data: Partial<BlockchainData>) {
  if (!this.blockchainData) {
    this.blockchainData = {} as BlockchainData;
  }
  Object.assign(this.blockchainData, data);
  return this.save();
};

nftRequestSchema.methods['setMetadata'] = function(this: INFTRequestDocument, metadata: NFTMetadata) {
  this.metadata = metadata;
  return this.save();
};

// Static methods
nftRequestSchema.statics['findByRequestId'] = function(requestId: string) {
  return this.findOne({ requestId }).populate('userId');
};

nftRequestSchema.statics['findByWallet'] = function(walletAddress: string, options: any = {}) {
  const query = { walletAddress: walletAddress.toLowerCase() };
  return this.find(query, null, options).populate('userId').sort({ createdAt: -1 });
};

nftRequestSchema.statics['findByStatus'] = function(status: RequestStatus, options: any = {}) {
  return this.find({ status }, null, options).populate('userId').sort({ createdAt: -1 });
};

nftRequestSchema.statics['getRequestStats'] = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      }
    }
  ]);
};

nftRequestSchema.statics['getUserRequestStats'] = function(userId: Types.ObjectId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      }
    }
  ]);
};

nftRequestSchema.statics['findPendingRequests'] = function(limit: number = 10) {
  return this.find({ 
    status: RequestStatus.PENDING 
  })
  .populate('userId')
  .sort({ createdAt: 1 })
  .limit(limit);
};

// Pre-save middleware
nftRequestSchema.pre('save', async function(next) {
  // Normalize wallet address
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  // Auto-set completion date
  if (this.isModified('status') && this.status === RequestStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

// Post-save middleware for analytics
nftRequestSchema.post('save', function(doc) {
  console.log(`NFT Request ${doc.requestId} status updated to ${doc.status}`);
});

// Virtual for processing time
nftRequestSchema.virtual('processingTime').get(function() {
  if (this.completedAt && this.createdAt) {
    return this.completedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

export interface INFTRequestDocument extends Omit<INFTRequest, '_id'>, Document {
  toJSON(): INFTRequest;
  updateStatus(status: RequestStatus, errorMessage?: string): Promise<INFTRequestDocument>;
  setAIGenerationData(data: Partial<AIGenerationData>): Promise<INFTRequestDocument>;
  setBlockchainData(data: Partial<BlockchainData>): Promise<INFTRequestDocument>;
  setMetadata(metadata: NFTMetadata): Promise<INFTRequestDocument>;
}

export interface INFTRequestModel extends mongoose.Model<INFTRequestDocument> {
  findByRequestId(requestId: string): Promise<INFTRequestDocument | null>;
  findByWallet(walletAddress: string, options?: any): Promise<INFTRequestDocument[]>;
  findByStatus(status: RequestStatus, options?: any): Promise<INFTRequestDocument[]>;
  getRequestStats(): Promise<Array<{ _id: string; count: number }>>;
  getUserRequestStats(userId: Types.ObjectId): Promise<Array<{ _id: string; count: number }>>;
  findPendingRequests(limit?: number): Promise<INFTRequestDocument[]>;
}

export const NFTRequest = mongoose.model<INFTRequestDocument, INFTRequestModel>('NFTRequest', nftRequestSchema);