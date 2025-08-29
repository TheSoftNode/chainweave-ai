import { Types } from 'mongoose';
import { User } from '@/models/User';
import { UserAnalytics } from '@/models/UserAnalytics';
import { NFTRequest } from '@/models/NFTRequest';
import { IUser, UserUpdateBody, ServiceResponse, PaginationQuery } from '@/types';
import { logger } from '@/utils/logger';

export class UserService {
  /**
   * Create or get user by wallet address
   */
  public async createOrGetUser(walletAddress: string): Promise<ServiceResponse<IUser>> {
    try {
      logger.info('Creating or getting user', { walletAddress });

      let user = await User.findByWallet(walletAddress);
      
      if (!user) {
        user = new User({ walletAddress });
        await user.save();
        
        logger.info('New user created', { 
          walletAddress,
          userId: user._id 
        });
      } else {
        await user.updateLastActivity();
        
        logger.info('Existing user found', { 
          walletAddress,
          userId: user._id 
        });
      }

      return {
        success: true,
        data: user.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to create or get user', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'User operation failed',
      };
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<ServiceResponse<IUser>> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: user.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to get user by ID', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve user',
      };
    }
  }

  /**
   * Get user by wallet address
   */
  public async getUserByWallet(walletAddress: string): Promise<ServiceResponse<IUser>> {
    try {
      const user = await User.findByWallet(walletAddress);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: user.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to get user by wallet', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve user',
      };
    }
  }

  /**
   * Update user profile
   */
  public async updateUser(userId: string, updateData: UserUpdateBody): Promise<ServiceResponse<IUser>> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update allowed fields
      if (updateData.email !== undefined) {
        // Check if email is already taken
        if (updateData.email) {
          const existingUser = await User.findByEmail(updateData.email);
          if (existingUser && existingUser._id.toString() !== userId) {
            return {
              success: false,
              error: 'Email already in use',
            };
          }
        }
        user.email = updateData.email;
      }

      if (updateData.username !== undefined) {
        // Check if username is already taken
        if (updateData.username) {
          const existingUser = await User.findByUsername(updateData.username);
          if (existingUser && existingUser._id.toString() !== userId) {
            return {
              success: false,
              error: 'Username already in use',
            };
          }
        }
        user.username = updateData.username;
      }

      if (updateData.avatar !== undefined) {
        user.avatar = updateData.avatar;
      }

      if (updateData.preferences !== undefined) {
        user.preferences = { ...user.preferences, ...updateData.preferences };
      }

      await user.save();

      logger.info('User updated successfully', { 
        userId,
        updatedFields: Object.keys(updateData),
      });

      return {
        success: true,
        data: user.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to update user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(userId: string): Promise<ServiceResponse<{
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    totalSpent: number;
    favoriteChains: number[];
    joinDate: Date;
    lastActivity: Date;
  }>> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Get request statistics
      const requestStats = await NFTRequest.getUserRequestStats(new Types.ObjectId(userId));
      
      const stats = requestStats.reduce((acc, stat) => {
        switch (stat._id) {
          case 'completed':
            acc.completedRequests = stat.count;
            break;
          case 'failed':
          case 'cancelled':
            acc.failedRequests += stat.count;
            break;
          default:
            acc.totalRequests += stat.count;
        }
        return acc;
      }, {
        totalRequests: 0,
        completedRequests: 0,
        failedRequests: 0,
        totalSpent: 0,
        favoriteChains: [] as number[],
        joinDate: user.createdAt,
        lastActivity: user.updatedAt,
      });

      // Get total spent from user analytics
      const analytics = await UserAnalytics.find({ userId: new Types.ObjectId(userId) });
      stats.totalSpent = analytics.reduce((sum, record) => sum + record.totalSpent, 0);

      // Get favorite chains
      const chainUsage = await NFTRequest.aggregate([
        { $match: { userId: new Types.ObjectId(userId), status: 'completed' } },
        { $group: { _id: '$destinationChainId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]);

      stats.favoriteChains = chainUsage.map(chain => chain._id);
      stats.totalRequests = requestStats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        success: true,
        data: stats,
      };

    } catch (error) {
      logger.error('Failed to get user stats', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve user statistics',
      };
    }
  }

  /**
   * Get user's NFT history with pagination
   */
  public async getUserNFTHistory(
    userId: string,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    requests: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
        };
      }

      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(50, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const [requests, totalCount] = await Promise.all([
        NFTRequest.find({ userId: new Types.ObjectId(userId) })
          .populate('userId', 'walletAddress username avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        NFTRequest.countDocuments({ userId: new Types.ObjectId(userId) }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          requests: requests.map(req => req.toJSON()),
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };

    } catch (error) {
      logger.error('Failed to get user NFT history', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve NFT history',
      };
    }
  }

  /**
   * Deactivate user account
   */
  public async deactivateUser(userId: string): Promise<ServiceResponse<void>> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid user ID format',
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      user.isActive = false;
      await user.save();

      logger.info('User deactivated', { userId });

      return { success: true };

    } catch (error) {
      logger.error('Failed to deactivate user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to deactivate user',
      };
    }
  }

  /**
   * Get all users with pagination (admin only)
   */
  public async getAllUsers(
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    users: IUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> {
    try {
      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(100, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const sortField = pagination.sort || 'createdAt';
      const sortOrder = pagination.order === 'asc' ? 1 : -1;

      const [users, totalCount] = await Promise.all([
        User.find({ isActive: true })
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limit),
        User.countDocuments({ isActive: true }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          users: users.map(user => user.toJSON()),
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };

    } catch (error) {
      logger.error('Failed to get all users', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve users',
      };
    }
  }

  /**
   * Search users by username or email
   */
  public async searchUsers(query: string): Promise<ServiceResponse<IUser[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
        };
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      
      const users = await User.find({
        isActive: true,
        $or: [
          { username: searchRegex },
          { email: searchRegex },
        ],
      }).limit(20);

      return {
        success: true,
        data: users.map(user => user.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to search users', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Search failed',
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();