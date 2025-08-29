import mongoose, { Schema, Document } from 'mongoose';
import { IPlatformStats } from '@/types';

// Platform stats schema
const platformStatsSchema = new Schema<IPlatformStatsDocument>({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    unique: true,
    index: true,
  },
  totalUsers: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalRequests: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  completedRequests: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  failedRequests: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalVolume: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  activeChains: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  versionKey: false,
});

// Indexes for analytics queries
platformStatsSchema.index({ date: -1 });

// Static methods for analytics
platformStatsSchema.statics['getStatsForDateRange'] = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    }
  }).sort({ date: 1 });
};

platformStatsSchema.statics['getLatestStats'] = function() {
  return this.findOne().sort({ date: -1 });
};

platformStatsSchema.statics['getTotalStats'] = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: '$totalUsers' },
        totalRequests: { $sum: '$totalRequests' },
        completedRequests: { $sum: '$completedRequests' },
        failedRequests: { $sum: '$failedRequests' },
        totalVolume: { $sum: '$totalVolume' },
        avgActiveChains: { $avg: '$activeChains' },
      }
    }
  ]);
};

export interface IPlatformStatsDocument extends Omit<IPlatformStats, '_id'>, Document {}

export interface IPlatformStatsModel extends mongoose.Model<IPlatformStatsDocument> {
  getStatsForDateRange(startDate: Date, endDate: Date): Promise<IPlatformStatsDocument[]>;
  getLatestStats(): Promise<IPlatformStatsDocument | null>;
  getTotalStats(): Promise<any[]>;
}

export const PlatformStats = mongoose.model<IPlatformStatsDocument, IPlatformStatsModel>('PlatformStats', platformStatsSchema);