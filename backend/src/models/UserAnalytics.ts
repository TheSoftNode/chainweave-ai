import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUserAnalytics } from '@/types';

// User analytics schema
const userAnalyticsSchema = new Schema<IUserAnalyticsDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
  },
  requestsCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  completedCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  totalSpent: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  favoriteChains: [{
    type: Number,
    min: 1,
  }],
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  versionKey: false,
});

// Compound indexes
userAnalyticsSchema.index({ userId: 1, date: -1 });
userAnalyticsSchema.index({ date: -1 });

// Static methods
userAnalyticsSchema.statics['getUserStatsForPeriod'] = function(
  userId: Types.ObjectId, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

userAnalyticsSchema.statics['getTopUsers'] = function(limit: number = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$userId',
        totalRequests: { $sum: '$requestsCount' },
        totalCompleted: { $sum: '$completedCount' },
        totalSpent: { $sum: '$totalSpent' },
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $sort: { totalSpent: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

export interface IUserAnalyticsDocument extends Omit<IUserAnalytics, '_id'>, Document {}

export interface IUserAnalyticsModel extends mongoose.Model<IUserAnalyticsDocument> {
  getUserStatsForPeriod(userId: Types.ObjectId, startDate: Date, endDate: Date): Promise<IUserAnalyticsDocument[]>;
  getTopUsers(limit?: number): Promise<any[]>;
}

export const UserAnalytics = mongoose.model<IUserAnalyticsDocument, IUserAnalyticsModel>('UserAnalytics', userAnalyticsSchema);