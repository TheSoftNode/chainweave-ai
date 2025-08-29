import { Types } from 'mongoose';
import { Collection } from '@/models/Collection';
import { User } from '@/models/User';
import { NFTRequest } from '@/models/NFTRequest';
import { ICollection, CollectionMetadata, ServiceResponse, PaginationQuery } from '@/types';
import { logger } from '@/utils/logger';

export class CollectionService {
  /**
   * Create a new collection
   */
  public async createCollection(data: {
    name: string;
    description: string;
    chainId: number;
    contractAddress: string;
    creatorWallet: string;
    royalty?: number;
    metadata?: CollectionMetadata;
  }): Promise<ServiceResponse<ICollection>> {
    try {
      logger.info('Creating new collection', {
        name: data.name,
        chainId: data.chainId,
        creatorWallet: data.creatorWallet,
      });

      // Validate creator exists
      const creator = await User.findByWallet(data.creatorWallet);
      if (!creator) {
        return {
          success: false,
          error: 'Creator not found',
        };
      }

      // Check if collection with same contract address already exists
      const existingCollection = await Collection.findOne({
        contractAddress: data.contractAddress.toLowerCase(),
      });

      if (existingCollection) {
        return {
          success: false,
          error: 'Collection with this contract address already exists',
        };
      }

      // Create collection
      const collection = new Collection({
        name: data.name,
        description: data.description,
        chainId: data.chainId,
        contractAddress: data.contractAddress.toLowerCase(),
        creatorId: creator._id,
        royalty: data.royalty || 500, // 5% default
        metadata: data.metadata || {},
      });

      await collection.save();

      logger.info('Collection created successfully', {
        collectionId: collection._id,
        name: data.name,
        contractAddress: data.contractAddress,
      });

      return {
        success: true,
        data: collection.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to create collection', {
        name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection',
      };
    }
  }

  /**
   * Get collection by ID
   */
  public async getCollectionById(collectionId: string): Promise<ServiceResponse<ICollection>> {
    try {
      if (!Types.ObjectId.isValid(collectionId)) {
        return {
          success: false,
          error: 'Invalid collection ID format',
        };
      }

      const collection = await Collection.findById(collectionId)
        .populate('creatorId', 'walletAddress username avatar');

      if (!collection) {
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      return {
        success: true,
        data: collection.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to get collection by ID', {
        collectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collection',
      };
    }
  }

  /**
   * Get collection by contract address
   */
  public async getCollectionByContract(contractAddress: string): Promise<ServiceResponse<ICollection>> {
    try {
      const collection = await Collection.findOne({
        contractAddress: contractAddress.toLowerCase(),
        isActive: true,
      }).populate('creatorId', 'walletAddress username avatar');

      if (!collection) {
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      return {
        success: true,
        data: collection.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to get collection by contract', {
        contractAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collection',
      };
    }
  }

  /**
   * Get collections by chain
   */
  public async getCollectionsByChain(
    chainId: number,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    collections: ICollection[];
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
      const limit = Math.min(50, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const [collections, totalCount] = await Promise.all([
        Collection.find({ chainId, isActive: true })
          .populate('creatorId', 'walletAddress username avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Collection.countDocuments({ chainId, isActive: true }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          collections: collections.map((col: any) => col.toJSON()),
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
      logger.error('Failed to get collections by chain', {
        chainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collections',
      };
    }
  }

  /**
   * Get collections by creator
   */
  public async getCollectionsByCreator(
    creatorWallet: string,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    collections: ICollection[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> {
    try {
      // Find creator
      const creator = await User.findByWallet(creatorWallet);
      if (!creator) {
        return {
          success: false,
          error: 'Creator not found',
        };
      }

      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(50, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const [collections, totalCount] = await Promise.all([
        Collection.find({ creatorId: creator._id, isActive: true })
          .populate('creatorId', 'walletAddress username avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Collection.countDocuments({ creatorId: creator._id, isActive: true }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          collections: collections.map((col: any) => col.toJSON()),
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
      logger.error('Failed to get collections by creator', {
        creatorWallet,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collections',
      };
    }
  }

  /**
   * Update collection metadata
   */
  public async updateCollection(
    collectionId: string,
    creatorWallet: string,
    updateData: {
      name?: string;
      description?: string;
      royalty?: number;
      metadata?: CollectionMetadata;
    }
  ): Promise<ServiceResponse<ICollection>> {
    try {
      if (!Types.ObjectId.isValid(collectionId)) {
        return {
          success: false,
          error: 'Invalid collection ID format',
        };
      }

      const collection = await Collection.findById(collectionId)
        .populate('creatorId', 'walletAddress');

      if (!collection) {
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      // Verify creator ownership
      if ((collection.creatorId as any).walletAddress !== creatorWallet.toLowerCase()) {
        return {
          success: false,
          error: 'Unauthorized: Only collection creator can update',
        };
      }

      // Update allowed fields
      if (updateData.name) collection.name = updateData.name;
      if (updateData.description) collection.description = updateData.description;
      if (updateData.royalty !== undefined) {
        if (updateData.royalty < 0 || updateData.royalty > 1000) {
          return {
            success: false,
            error: 'Royalty must be between 0 and 10%',
          };
        }
        collection.royalty = updateData.royalty;
      }
      if (updateData.metadata) {
        collection.metadata = { ...collection.metadata, ...updateData.metadata };
      }

      await collection.save();

      logger.info('Collection updated successfully', {
        collectionId,
        updatedFields: Object.keys(updateData),
      });

      return {
        success: true,
        data: collection.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to update collection', {
        collectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update collection',
      };
    }
  }

  /**
   * Update collection supply statistics
   */
  public async updateCollectionSupply(
    contractAddress: string,
    minted: number,
    burned: number = 0
  ): Promise<ServiceResponse<void>> {
    try {
      const collection = await Collection.findOne({
        contractAddress: contractAddress.toLowerCase(),
      });

      if (!collection) {
        logger.warn('Collection not found for supply update', { contractAddress });
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      await collection.updateSupply(minted, burned);

      logger.info('Collection supply updated', {
        contractAddress,
        minted,
        burned,
        newTotalSupply: collection.totalSupply,
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to update collection supply', {
        contractAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to update collection supply',
      };
    }
  }

  /**
   * Get collection statistics
   */
  public async getCollectionStats(collectionId: string): Promise<ServiceResponse<{
    totalSupply: number;
    totalMinted: number;
    uniqueHolders: number;
    totalVolume: number;
    floorPrice: number;
    recentSales: any[];
    topHolders: any[];
  }>> {
    try {
      if (!Types.ObjectId.isValid(collectionId)) {
        return {
          success: false,
          error: 'Invalid collection ID format',
        };
      }

      const collection = await Collection.findById(collectionId);
      if (!collection) {
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      // Get NFTs from this collection
      const nfts = await NFTRequest.find({
        'blockchainData.contractAddress': collection.contractAddress,
        status: 'completed',
      });

      // Calculate unique holders
      const holders = new Set(nfts.map(nft => nft.walletAddress));
      const uniqueHolders = holders.size;

      // Calculate total volume (sum of fees paid)
      const totalVolume = nfts.reduce((sum, nft) => sum + (nft.fee || 0), 0);

      // For now, we'll use basic stats from the collection model
      // In a full implementation, you'd query marketplace data for floor price, recent sales, etc.
      
      return {
        success: true,
        data: {
          totalSupply: collection.totalSupply,
          totalMinted: collection.totalMinted,
          uniqueHolders,
          totalVolume,
          floorPrice: 0, // Would be calculated from marketplace data
          recentSales: [], // Would be fetched from marketplace events
          topHolders: [], // Would be calculated from token holdings
        },
      };

    } catch (error) {
      logger.error('Failed to get collection stats', {
        collectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collection statistics',
      };
    }
  }

  /**
   * Search collections
   */
  public async searchCollections(
    query: string,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<ICollection[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
        };
      }

      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(50, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const collections = await Collection.find({
        isActive: true,
        $text: { $search: query },
      })
      .populate('creatorId', 'walletAddress username avatar')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

      return {
        success: true,
        data: collections.map(col => col.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to search collections', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Search failed',
      };
    }
  }

  /**
   * Get featured collections
   */
  public async getFeaturedCollections(limit: number = 10): Promise<ServiceResponse<ICollection[]>> {
    try {
      // For now, we'll return collections with highest total supply
      // In a full implementation, this could be based on various factors like volume, activity, etc.
      const collections = await Collection.find({ isActive: true })
        .populate('creatorId', 'walletAddress username avatar')
        .sort({ totalSupply: -1, createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        data: collections.map(col => col.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to get featured collections', {
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve featured collections',
      };
    }
  }

  /**
   * Get trending collections
   */
  public async getTrendingCollections(
    period: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<ServiceResponse<ICollection[]>> {
    try {
      const periodMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
      }[period];

      const startDate = new Date(Date.now() - periodMs);

      // Get collections with most activity in the period
      const trendingStats = await NFTRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed',
            'blockchainData.contractAddress': { $exists: true },
          }
        },
        {
          $group: {
            _id: '$blockchainData.contractAddress',
            activityCount: { $sum: 1 },
            totalVolume: { $sum: '$fee' },
          }
        },
        {
          $sort: { activityCount: -1, totalVolume: -1 }
        },
        {
          $limit: limit
        }
      ]);

      // Get collection details
      const contractAddresses = trendingStats.map(stat => stat._id);
      const collections = await Collection.find({
        contractAddress: { $in: contractAddresses },
        isActive: true,
      }).populate('creatorId', 'walletAddress username avatar');

      // Sort collections by trending stats
      const sortedCollections = collections.sort((a, b) => {
        const aStats = trendingStats.find(s => s._id === a.contractAddress);
        const bStats = trendingStats.find(s => s._id === b.contractAddress);
        return (bStats?.activityCount || 0) - (aStats?.activityCount || 0);
      });

      return {
        success: true,
        data: sortedCollections.map(col => col.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to get trending collections', {
        period,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve trending collections',
      };
    }
  }

  /**
   * Deactivate collection
   */
  public async deactivateCollection(
    collectionId: string,
    creatorWallet: string
  ): Promise<ServiceResponse<void>> {
    try {
      if (!Types.ObjectId.isValid(collectionId)) {
        return {
          success: false,
          error: 'Invalid collection ID format',
        };
      }

      const collection = await Collection.findById(collectionId)
        .populate('creatorId', 'walletAddress');

      if (!collection) {
        return {
          success: false,
          error: 'Collection not found',
        };
      }

      // Verify creator ownership
      if ((collection.creatorId as any).walletAddress !== creatorWallet.toLowerCase()) {
        return {
          success: false,
          error: 'Unauthorized: Only collection creator can deactivate',
        };
      }

      collection.isActive = false;
      await collection.save();

      logger.info('Collection deactivated', { collectionId, creatorWallet });

      return { success: true };

    } catch (error) {
      logger.error('Failed to deactivate collection', {
        collectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to deactivate collection',
      };
    }
  }

  /**
   * Get all collections with pagination (admin only)
   */
  public async getAllCollections(
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    collections: ICollection[];
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

      const [collections, totalCount] = await Promise.all([
        Collection.find()
          .populate('creatorId', 'walletAddress username avatar')
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limit),
        Collection.countDocuments(),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          collections: collections.map((col: any) => col.toJSON()),
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
      logger.error('Failed to get all collections', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve collections',
      };
    }
  }
}

// Export singleton instance
export const collectionService = new CollectionService();