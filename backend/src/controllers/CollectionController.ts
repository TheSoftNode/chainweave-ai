import { Request, Response } from 'express';
import { collectionService } from '@/services/CollectionService';
import { AuthenticatedRequest, ApiResponse, PaginationQuery, CollectionMetadata } from '@/types';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';

export class CollectionController {
  /**
   * Create a new collection
   */
  public async createCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const {
        name,
        description,
        chainId,
        contractAddress,
        royalty,
        metadata,
      } = req.body;

      const result = await collectionService.createCollection({
        name,
        description,
        chainId,
        contractAddress,
        creatorWallet: req.user.walletAddress,
        royalty,
        metadata,
      });

      if (!result.success) {
        const statusCode = result.error?.includes('already exists') ? 409 :
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Collection created successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in createCollection controller', {
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
   * Get collection by ID
   */
  public async getCollectionById(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId } = req.params;

      const result = await collectionService.getCollectionById(collectionId!);

      if (!result.success) {
        const statusCode = result.error === 'Collection not found' ? 404 :
                          result.error?.includes('Invalid') ? 400 : 400;
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
      logger.error('Error in getCollectionById controller', {
        collectionId: req.params['collectionId'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get collection by contract address
   */
  public async getCollectionByContract(req: Request, res: Response): Promise<void> {
    try {
      const { contractAddress } = req.params;

      const result = await collectionService.getCollectionByContract(contractAddress!);

      if (!result.success) {
        const statusCode = result.error === 'Collection not found' ? 404 : 400;
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
      logger.error('Error in getCollectionByContract controller', {
        contractAddress: req.params['contractAddress'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get collections by chain
   */
  public async getCollectionsByChain(req: Request, res: Response): Promise<void> {
    try {
      const chainId = parseInt(req.params['chainId']!);

      if (isNaN(chainId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid chain ID',
        } as ApiResponse);
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
      };

      const result = await collectionService.getCollectionsByChain(chainId, pagination);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.collections,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getCollectionsByChain controller', {
        chainId: req.params['chainId'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get collections by creator
   */
  public async getCollectionsByCreator(req: Request, res: Response): Promise<void> {
    try {
      const { creatorWallet } = req.params;

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
      };

      const result = await collectionService.getCollectionsByCreator(creatorWallet!, pagination);

      if (!result.success) {
        const statusCode = result.error === 'Creator not found' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.collections,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getCollectionsByCreator controller', {
        creatorWallet: req.params['creatorWallet'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get current user's collections
   */
  public async getUserCollections(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      };

      const result = await collectionService.getCollectionsByCreator(
        req.user.walletAddress,
        pagination
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.collections,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserCollections controller', {
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
   * Update collection
   */
  public async updateCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { collectionId } = req.params;
      const updateData: {
        name?: string;
        description?: string;
        royalty?: number;
        metadata?: CollectionMetadata;
      } = req.body;

      const result = await collectionService.updateCollection(
        collectionId!,
        req.user.walletAddress,
        updateData
      );

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 :
                          result.error?.includes('Unauthorized') ? 403 :
                          result.error?.includes('Invalid') ? 400 :
                          result.error?.includes('Royalty must') ? 400 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Collection updated successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in updateCollection controller', {
        collectionId: req.params['collectionId'],
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
   * Get collection statistics
   */
  public async getCollectionStats(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId } = req.params;

      const result = await collectionService.getCollectionStats(collectionId!);

      if (!result.success) {
        const statusCode = result.error === 'Collection not found' ? 404 :
                          result.error?.includes('Invalid') ? 400 : 400;
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
      logger.error('Error in getCollectionStats controller', {
        collectionId: req.params['collectionId'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Search collections
   */
  public async searchCollections(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        } as ApiResponse);
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
      };

      const result = await collectionService.searchCollections(query, pagination);

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
      logger.error('Error in searchCollections controller', {
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
   * Get featured collections
   */
  public async getFeaturedCollections(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query['limit'] as string) || 10));

      const result = await collectionService.getFeaturedCollections(limit);

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
      logger.error('Error in getFeaturedCollections controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get trending collections
   */
  public async getTrendingCollections(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query['period'] as 'day' | 'week' | 'month' || 'week';
      const limit = Math.min(50, Math.max(1, parseInt(req.query['limit'] as string) || 10));

      if (!['day', 'week', 'month'].includes(period)) {
        res.status(400).json({
          success: false,
          error: 'Invalid period. Must be day, week, or month',
        } as ApiResponse);
        return;
      }

      const result = await collectionService.getTrendingCollections(period, limit);

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
      logger.error('Error in getTrendingCollections controller', {
        period: req.query['period'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Deactivate collection
   */
  public async deactivateCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const { collectionId } = req.params;

      const result = await collectionService.deactivateCollection(
        collectionId!,
        req.user.walletAddress
      );

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 :
                          result.error?.includes('Unauthorized') ? 403 :
                          result.error?.includes('Invalid') ? 400 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Collection deactivated successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in deactivateCollection controller', {
        collectionId: req.params['collectionId'],
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
   * Get all collections (admin only)
   */
  public async getAllCollections(req: Request, res: Response): Promise<void> {
    try {
      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await collectionService.getAllCollections(pagination);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data?.collections,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getAllCollections controller', {
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
export const collectionController = new CollectionController();