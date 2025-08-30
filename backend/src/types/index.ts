import { Request } from 'express';
import { Types } from 'mongoose';

// User-related types
export interface IUser {
  _id: Types.ObjectId;
  walletAddress: string;
  email?: string;
  username?: string;
  avatar?: string;
  isActive: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultChain: number;
  aiStyle: string;
  notifications: boolean;
  publicProfile: boolean;
  emailNotifications?: boolean;
  theme?: 'light' | 'dark';
}

// NFT Request types
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AI_COMPLETED = 'ai_completed',
  CROSS_CHAIN_PENDING = 'cross_chain_pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface INFTRequest {
  _id: Types.ObjectId;
  requestId: string;
  userId: Types.ObjectId;
  walletAddress: string;
  prompt: string;
  destinationChainId: number;
  recipient: string;
  status: RequestStatus;
  fee?: number;
  aiGenerationData?: AIGenerationData;
  blockchainData?: BlockchainData;
  metadata?: NFTMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface AIGenerationData {
  model: string;
  generatedImageUrl?: string;
  ipfsHash?: string;
  tokenURI?: string;
  processingTime?: number;
  retryCount: number;
}

export interface BlockchainData {
  transactionHash?: string;
  tokenId?: number;
  contractAddress?: string;
  gasUsed?: number;
  blockNumber?: number;
  confirmations?: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

// Collection types
export interface ICollection {
  _id: Types.ObjectId;
  name: string;
  description: string;
  chainId: number;
  contractAddress: string;
  creatorId: Types.ObjectId;
  totalSupply: number;
  totalMinted: number;
  royalty: number;
  isActive: boolean;
  metadata: CollectionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionMetadata {
  image?: string;
  banner?: string;
  website?: string;
  discord?: string;
  twitter?: string;
}

// Analytics types
export interface IPlatformStats {
  _id: Types.ObjectId;
  date: Date;
  totalUsers: number;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  totalVolume: number;
  activeChains: number;
  createdAt: Date;
}

export interface IUserAnalytics {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  requestsCount: number;
  completedCount: number;
  totalSpent: number;
  favoriteChains: number[];
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: any; // Will be IUserDocument from mongoose
  walletAddress?: string;
}

export interface NFTRequestBody {
  prompt: string;
  destinationChainId: number;
  recipient?: string;
  style?: string;
  attributes?: Record<string, any>;
}

export interface UserUpdateBody {
  email?: string;
  username?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

// Blockchain types
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  contractAddress: string;
  isActive: boolean;
}

export interface TransactionResult {
  hash: string;
  blockNumber: number;
  gasUsed: number;
  success: boolean;
  error?: string;
}

// AI Generation types
export interface AIGenerationRequest {
  prompt: string;
  style?: string;
  model?: string;
  size?: string;
  quality?: string;
}

export interface AIGenerationResult {
  imageUrl: string;
  ipfsHash: string;
  tokenURI: string;
  metadata: NFTMetadata;
  processingTime: number;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Service types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    blockchain: 'connected' | 'disconnected' | 'error';
    ai: 'available' | 'unavailable' | 'error';
    ipfs: 'available' | 'unavailable' | 'error';
  };
  uptime: number;
  version: string;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}