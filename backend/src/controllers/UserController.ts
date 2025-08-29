import { Request, Response } from 'express';
import { userService } from '@/services/UserService';
import { AuthenticatedRequest, ApiResponse, UserUpdateBody, PaginationQuery } from '@/types';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';

export class UserController {
  /**
   * Create or get user by wallet address
   */
  public async createOrGetUser(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Wallet address is required',
        } as ApiResponse);
        return;
      }

      const result = await userService.createOrGetUser(walletAddress);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(result.data?.createdAt === result.data?.updatedAt ? 201 : 200).json({
        success: true,
        data: result.data,
        message: result.data?.createdAt === result.data?.updatedAt ? 'User created successfully' : 'User retrieved successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in createOrGetUser controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: req.user,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getCurrentUser controller', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const result = await userService.getUserById(userId!);

      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserById controller', {
        userId: req.params['userId'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user by wallet address
   */
  public async getUserByWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const result = await userService.getUserByWallet(walletAddress!);

      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserByWallet controller', {
        walletAddress: req.params['walletAddress'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Update user profile
   */
  public async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        } as ApiResponse);
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const updateData: UserUpdateBody = req.body;
      const result = await userService.updateUser(req.user._id.toString(), updateData);

      if (!result.success) {
        const statusCode = result.error?.includes('already in use') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'User profile updated successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in updateUser controller', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const result = await userService.getUserStats(req.user._id.toString());

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserStats controller', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user's public statistics by wallet
   */
  public async getUserStatsByWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      // First get user by wallet
      const userResult = await userService.getUserByWallet(walletAddress!);
      if (!userResult.success) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        } as ApiResponse);
        return;
      }

      const result = await userService.getUserStats(userResult.data!._id.toString());

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      // Return only public stats
      const publicStats = {
        totalRequests: result.data?.totalRequests,
        completedRequests: result.data?.completedRequests,
        favoriteChains: result.data?.favoriteChains,
        joinDate: result.data?.joinDate,
      };

      res.status(200).json({
        success: true,
        data: publicStats,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserStatsByWallet controller', {
        walletAddress: req.params['walletAddress'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user's NFT history
   */
  public async getUserNFTHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await userService.getUserNFTHistory(req.user._id.toString(), pagination);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.requests,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserNFTHistory controller', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get public NFT history by wallet
   */
  public async getPublicNFTHistory(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      // First get user by wallet
      const userResult = await userService.getUserByWallet(walletAddress!);
      if (!userResult.success) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        } as ApiResponse);
        return;
      }

      // Check if user has public profile enabled
      if (!userResult.data!.preferences?.publicProfile) {
        res.status(403).json({
          success: false,
          error: 'User profile is private',
        } as ApiResponse);
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await userService.getUserNFTHistory(userResult.data!._id.toString(), pagination);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      // Filter out private data from NFT history
      const publicHistory = result.data?.requests.map(request => ({
        requestId: request.requestId,
        prompt: request.prompt,
        destinationChainId: request.destinationChainId,
        status: request.status,
        metadata: request.metadata,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      }));

      res.status(200).json({
        success: true,
        data: publicHistory,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getPublicNFTHistory controller', {
        walletAddress: req.params['walletAddress'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Search users (admin only)
   */
  public async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        } as ApiResponse);
        return;
      }

      const result = await userService.searchUsers(query);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in searchUsers controller', {
        query: req.query['query'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get all users (admin only)
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await userService.getAllUsers(pagination);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.users,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getAllUsers controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Deactivate user account
   */
  public async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const result = await userService.deactivateUser(req.user._id.toString());

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User account deactivated successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in deactivateUser controller', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }
}

// Export singleton instance
export const userController = new UserController();