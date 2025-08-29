import { Types } from 'mongoose';
import { PlatformStats } from '@/models/PlatformStats';
import { UserAnalytics } from '@/models/UserAnalytics';
import { User } from '@/models/User';
import { NFTRequest } from '@/models/NFTRequest';
import { ServiceResponse } from '@/types';
import { logger } from '@/utils/logger';
import { performanceLogger } from '@/utils/logger';

export class AnalyticsService {
  /**
   * Generate daily platform statistics
   */
  public async generateDailyStats(date: Date = new Date()): Promise<ServiceResponse<void>> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      logger.info('Generating daily platform stats', { date: startOfDay });

      // Check if stats already exist for this date
      const existingStats = await PlatformStats.findOne({ date: startOfDay });
      
      if (existingStats) {
        logger.info('Stats already exist for this date, updating', { date: startOfDay });
      }

      // Calculate stats
      const [
        totalUsers,
        totalRequests,
        completedRequests,
        failedRequests,
        totalVolume,
        activeChains,
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        NFTRequest.countDocuments({ 
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        NFTRequest.countDocuments({ 
          status: 'completed',
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        NFTRequest.countDocuments({ 
          status: { $in: ['failed', 'cancelled'] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        this.calculateDailyVolume(startOfDay, endOfDay),
        this.getActiveChainsCount(startOfDay, endOfDay),
      ]);

      const statsData = {
        date: startOfDay,
        totalUsers,
        totalRequests,
        completedRequests,
        failedRequests,
        totalVolume,
        activeChains,
      };

      if (existingStats) {
        await PlatformStats.updateOne({ date: startOfDay }, statsData);
      } else {
        const platformStats = new PlatformStats(statsData);
        await platformStats.save();
      }

      logger.info('Daily platform stats generated successfully', {
        date: startOfDay,
        totalRequests,
        completedRequests,
        totalVolume,
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to generate daily stats', {
        date,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stats generation failed',
      };
    }
  }

  /**
   * Generate user analytics for a specific user and date
   */
  public async generateUserAnalytics(
    userId: Types.ObjectId,
    date: Date = new Date()
  ): Promise<ServiceResponse<void>> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if analytics already exist
      const existingAnalytics = await UserAnalytics.findOne({ 
        userId, 
        date: startOfDay 
      });

      // Calculate user stats for the day
      const [requestsCount, completedCount, totalSpent, favoriteChains] = await Promise.all([
        NFTRequest.countDocuments({ 
          userId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        NFTRequest.countDocuments({ 
          userId,
          status: 'completed',
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        this.calculateUserDailySpent(userId, startOfDay, endOfDay),
        this.getUserFavoriteChains(userId, startOfDay, endOfDay),
      ]);

      const analyticsData = {
        userId,
        date: startOfDay,
        requestsCount,
        completedCount,
        totalSpent,
        favoriteChains,
      };

      if (existingAnalytics) {
        await UserAnalytics.updateOne({ userId, date: startOfDay }, analyticsData);
      } else {
        const userAnalytics = new UserAnalytics(analyticsData);
        await userAnalytics.save();
      }

      return { success: true };

    } catch (error) {
      logger.error('Failed to generate user analytics', {
        userId,
        date,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'User analytics generation failed',
      };
    }
  }

  /**
   * Get platform statistics for a date range
   */
  public async getPlatformStats(
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<{
    dailyStats: any[];
    summary: {
      totalUsers: number;
      totalRequests: number;
      completedRequests: number;
      failedRequests: number;
      totalVolume: number;
      avgDailyRequests: number;
      avgDailyVolume: number;
    };
  }>> {
    try {
      const dailyStats = await PlatformStats.getStatsForDateRange(startDate, endDate);
      
      // Calculate summary statistics
      const summary = dailyStats.reduce((acc, stat) => {
        acc.totalUsers = Math.max(acc.totalUsers, stat.totalUsers);
        acc.totalRequests += stat.totalRequests;
        acc.completedRequests += stat.completedRequests;
        acc.failedRequests += stat.failedRequests;
        acc.totalVolume += stat.totalVolume;
        return acc;
      }, {
        totalUsers: 0,
        totalRequests: 0,
        completedRequests: 0,
        failedRequests: 0,
        totalVolume: 0,
        avgDailyRequests: 0,
        avgDailyVolume: 0,
      });

      const days = dailyStats.length;
      if (days > 0) {
        summary.avgDailyRequests = summary.totalRequests / days;
        summary.avgDailyVolume = summary.totalVolume / days;
      }

      return {
        success: true,
        data: {
          dailyStats: dailyStats.map(stat => stat.toJSON()),
          summary,
        },
      };

    } catch (error) {
      logger.error('Failed to get platform stats', {
        startDate,
        endDate,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve platform statistics',
      };
    }
  }

  /**
   * Get user analytics for a date range
   */
  public async getUserAnalytics(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<{
    dailyAnalytics: any[];
    summary: {
      totalRequests: number;
      totalCompleted: number;
      totalSpent: number;
      avgDailyRequests: number;
      favoriteChains: number[];
    };
  }>> {
    try {
      const dailyAnalytics = await UserAnalytics.getUserStatsForPeriod(userId, startDate, endDate);
      
      // Calculate summary
      const summary = dailyAnalytics.reduce((acc, analytics) => {
        acc.totalRequests += analytics.requestsCount;
        acc.totalCompleted += analytics.completedCount;
        acc.totalSpent += analytics.totalSpent;
        
        // Merge favorite chains
        analytics.favoriteChains.forEach(chainId => {
          if (!acc.favoriteChains.includes(chainId)) {
            acc.favoriteChains.push(chainId);
          }
        });
        
        return acc;
      }, {
        totalRequests: 0,
        totalCompleted: 0,
        totalSpent: 0,
        avgDailyRequests: 0,
        favoriteChains: [] as number[],
      });

      const days = dailyAnalytics.length;
      if (days > 0) {
        summary.avgDailyRequests = summary.totalRequests / days;
      }

      return {
        success: true,
        data: {
          dailyAnalytics: dailyAnalytics.map(analytics => analytics.toJSON()),
          summary,
        },
      };

    } catch (error) {
      logger.error('Failed to get user analytics', {
        userId,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve user analytics',
      };
    }
  }

  /**
   * Get top users by various metrics
   */
  public async getTopUsers(
    metric: 'requests' | 'completed' | 'spent' = 'spent',
    limit: number = 10
  ): Promise<ServiceResponse<any[]>> {
    try {
      const topUsers = await UserAnalytics.getTopUsers(limit);
      
      // Sort by the requested metric
      const sortField = {
        'requests': 'totalRequests',
        'completed': 'totalCompleted',
        'spent': 'totalSpent',
      }[metric];

      const sortedUsers = topUsers.sort((a, b) => b[sortField] - a[sortField]);

      return {
        success: true,
        data: sortedUsers.slice(0, limit),
      };

    } catch (error) {
      logger.error('Failed to get top users', {
        metric,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve top users',
      };
    }
  }

  /**
   * Get chain usage statistics
   */
  public async getChainUsageStats(): Promise<ServiceResponse<{
    byChain: Array<{
      chainId: number;
      totalRequests: number;
      completedRequests: number;
      failedRequests: number;
      successRate: number;
    }>;
    totalChains: number;
    mostPopularChain: number;
  }>> {
    try {
      const chainStats = await NFTRequest.aggregate([
        {
          $group: {
            _id: '$destinationChainId',
            totalRequests: { $sum: 1 },
            completedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedRequests: {
              $sum: { 
                $cond: [
                  { $in: ['$status', ['failed', 'cancelled']] }, 
                  1, 
                  0
                ] 
              }
            },
          }
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $eq: ['$totalRequests', 0] },
                0,
                { $multiply: [{ $divide: ['$completedRequests', '$totalRequests'] }, 100] }
              ]
            }
          }
        },
        { $sort: { totalRequests: -1 } },
      ]);

      const byChain = chainStats.map(stat => ({
        chainId: stat._id,
        totalRequests: stat.totalRequests,
        completedRequests: stat.completedRequests,
        failedRequests: stat.failedRequests,
        successRate: Math.round(stat.successRate * 100) / 100,
      }));

      const totalChains = chainStats.length;
      const mostPopularChain = chainStats.length > 0 ? chainStats[0]._id : 0;

      return {
        success: true,
        data: {
          byChain,
          totalChains,
          mostPopularChain,
        },
      };

    } catch (error) {
      logger.error('Failed to get chain usage stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve chain usage statistics',
      };
    }
  }

  /**
   * Get real-time dashboard data
   */
  public async getDashboardData(): Promise<ServiceResponse<{
    overview: {
      totalUsers: number;
      totalRequests: number;
      completedToday: number;
      pendingRequests: number;
    };
    recentActivity: any[];
    popularChains: any[];
    systemHealth: {
      database: string;
      blockchain: string;
      ai: string;
      ipfs: string;
    };
  }>> {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        totalRequests,
        completedToday,
        pendingRequests,
        recentActivity,
        popularChains,
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        NFTRequest.countDocuments(),
        NFTRequest.countDocuments({ 
          status: 'completed',
          completedAt: { $gte: startOfToday }
        }),
        NFTRequest.countDocuments({ status: 'pending' }),
        this.getRecentActivity(10),
        this.getPopularChains(5),
      ]);

      // System health checks would be implemented here
      const systemHealth = {
        database: 'connected',
        blockchain: 'connected',
        ai: 'connected',
        ipfs: 'connected',
      };

      return {
        success: true,
        data: {
          overview: {
            totalUsers,
            totalRequests,
            completedToday,
            pendingRequests,
          },
          recentActivity,
          popularChains,
          systemHealth,
        },
      };

    } catch (error) {
      logger.error('Failed to get dashboard data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve dashboard data',
      };
    }
  }

  /**
   * Generate analytics report
   */
  public async generateAnalyticsReport(
    startDate: Date,
    endDate: Date,
    reportType: 'summary' | 'detailed' = 'summary'
  ): Promise<ServiceResponse<{
    period: { start: Date; end: Date };
    platformMetrics: any;
    userMetrics: any;
    chainMetrics: any;
    performanceMetrics: any;
  }>> {
    try {
      const startTime = Date.now();

      const [platformMetrics, chainMetrics, userMetrics] = await Promise.all([
        this.getPlatformStats(startDate, endDate),
        this.getChainUsageStats(),
        this.getUserGrowthMetrics(startDate, endDate),
      ]);

      const performanceMetrics = await this.getPerformanceMetrics(startDate, endDate);
      
      const processingTime = Date.now() - startTime;
      
      performanceLogger.info('Analytics report generated', {
        startDate,
        endDate,
        reportType,
        processingTime,
      });

      return {
        success: true,
        data: {
          period: { start: startDate, end: endDate },
          platformMetrics: platformMetrics.data,
          userMetrics,
          chainMetrics: chainMetrics.data,
          performanceMetrics,
        },
      };

    } catch (error) {
      logger.error('Failed to generate analytics report', {
        startDate,
        endDate,
        reportType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to generate analytics report',
      };
    }
  }

  // Private helper methods

  private async calculateDailyVolume(startDate: Date, endDate: Date): Promise<number> {
    const result = await NFTRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$fee' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalVolume : 0;
  }

  private async getActiveChainsCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await NFTRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$destinationChainId'
        }
      },
      {
        $count: 'activeChains'
      }
    ]);

    return result.length > 0 ? result[0].activeChains : 0;
  }

  private async calculateUserDailySpent(
    userId: Types.ObjectId, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    const result = await NFTRequest.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$fee' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalSpent : 0;
  }

  private async getUserFavoriteChains(
    userId: Types.ObjectId, 
    startDate: Date, 
    endDate: Date
  ): Promise<number[]> {
    const result = await NFTRequest.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$destinationChainId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 3
      }
    ]);

    return result.map(chain => chain._id);
  }

  private async getRecentActivity(limit: number): Promise<any[]> {
    return NFTRequest.find()
      .populate('userId', 'walletAddress username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('requestId prompt status destinationChainId createdAt');
  }

  private async getPopularChains(limit: number): Promise<any[]> {
    return NFTRequest.aggregate([
      {
        $group: {
          _id: '$destinationChainId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }

  private async getUserGrowthMetrics(startDate: Date, endDate: Date): Promise<any> {
    const result = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return {
      dailyGrowth: result,
      totalNewUsers: result.reduce((sum, day) => sum + day.newUsers, 0),
    };
  }

  private async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<any> {
    const result = await NFTRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed',
          'aiGenerationData.processingTime': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$aiGenerationData.processingTime' },
          minProcessingTime: { $min: '$aiGenerationData.processingTime' },
          maxProcessingTime: { $max: '$aiGenerationData.processingTime' },
          totalProcessed: { $sum: 1 }
        }
      }
    ]);

    return result.length > 0 ? result[0] : {
      avgProcessingTime: 0,
      minProcessingTime: 0,
      maxProcessingTime: 0,
      totalProcessed: 0,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();