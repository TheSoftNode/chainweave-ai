import { Request, Response } from 'express';
import { nftRequestService } from '@/services/NFTRequestService';
import { AuthenticatedRequest, ApiResponse, NFTRequestBody, PaginationQuery } from '@/types';
import { RequestStatus } from '@/types';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';

export class NFTRequestController {
  /**
   * Get chain name from chain ID
   */
  private getChainName(chainId: number): string {
    const chainMap: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon', 
      56: 'BSC',
      7000: 'ZetaChain',
      7001: 'ZetaChain Testnet',
      11155111: 'Ethereum Sepolia',
      80002: 'Polygon Amoy',
      97: 'BSC Testnet',
      84532: 'Base Sepolia',
    };
    return chainMap[chainId] || `Chain ${chainId}`;
  }
  /**
   * Create a new NFT request
   */
  public async createRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const requestData: NFTRequestBody = req.body;
      const result = await nftRequestService.createRequest(req.user.walletAddress, requestData);

      if (!result.success) {
        const statusCode = result.error?.includes('not supported') ? 400 : 
                          result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      // Format response for frontend compatibility
      const nftData = result.data;
      if (!nftData) {
        res.status(500).json({
          success: false,
          error: 'Failed to create NFT request',
        } as ApiResponse);
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          id: nftData._id,
          requestId: nftData.requestId,
          name: nftData.metadata?.name || 'AI Generated Artwork',
          description: nftData.metadata?.description || '',
          status: nftData.status,
          chain: this.getChainName(nftData.destinationChainId),
          dateCreated: nftData.createdAt,
          imageUrl: nftData.aiGenerationData?.generatedImageUrl,
          tokenURI: nftData.aiGenerationData?.tokenURI,
          ipfsHash: nftData.aiGenerationData?.ipfsHash,
          metadata: nftData.metadata,
        },
        message: 'NFT request created successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in createRequest controller', {
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
   * Get request by ID
   */
  public async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      const result = await nftRequestService.getRequestById(requestId!);

      if (!result.success) {
        const statusCode = result.error === 'Request not found' ? 404 : 400;
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
      logger.error('Error in getRequestById controller', {
        requestId: req.params['requestId'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get current user's requests
   */
  public async getUserRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await nftRequestService.getRequestsByWallet(
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
        data: result.data?.requests,
        pagination: result.data?.pagination,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getUserRequests controller', {
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
   * Get requests by wallet address (public)
   */
  public async getRequestsByWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await nftRequestService.getRequestsByWallet(walletAddress!, pagination);

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
      logger.error('Error in getRequestsByWallet controller', {
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
   * Get requests by status (admin only)
   */
  public async getRequestsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;

      if (!Object.values(RequestStatus).includes(status as RequestStatus)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status',
        } as ApiResponse);
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 50,
        sort: req.query['sort'] as string,
        order: req.query['order'] as 'asc' | 'desc',
      };

      const result = await nftRequestService.getRequestsByStatus(
        status as RequestStatus,
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
        data: result.data,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getRequestsByStatus controller', {
        status: req.params['status'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Cancel request
   */
  public async cancelRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const result = await nftRequestService.cancelRequest(requestId!, req.user.walletAddress);

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 :
                          result.error?.includes('Unauthorized') ? 403 :
                          result.error?.includes('cannot be cancelled') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Request cancelled successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in cancelRequest controller', {
        requestId: req.params['requestId'],
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
   * Retry failed request
   */
  public async retryRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const result = await nftRequestService.retryRequest(requestId!, req.user.walletAddress);

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 :
                          result.error?.includes('Unauthorized') ? 403 :
                          result.error?.includes('Only failed requests') ? 409 :
                          result.error?.includes('Maximum retry') ? 429 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Request queued for retry',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in retryRequest controller', {
        requestId: req.params['requestId'],
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
   * Search requests by prompt
   */
  public async searchRequests(req: Request, res: Response): Promise<void> {
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

      const result = await nftRequestService.searchRequests(query, pagination);

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
      logger.error('Error in searchRequests controller', {
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
   * Get request statistics (admin only)
   */
  public async getRequestStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const result = await nftRequestService.getRequestStatistics();

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
      logger.error('Error in getRequestStatistics controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Process pending requests (admin/system only)
   */
  public async processPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const batchSize = parseInt(req.query['batchSize'] as string) || 5;

      if (batchSize < 1 || batchSize > 20) {
        res.status(400).json({
          success: false,
          error: 'Batch size must be between 1 and 20',
        } as ApiResponse);
        return;
      }

      const result = await nftRequestService.processPendingRequests(batchSize);

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
        message: `Processed ${result.data?.processed} requests, ${result.data?.failed} failed`,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in processPendingRequests controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user's NFT collection (frontend format)
   */
  public async getUserCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const result = await nftRequestService.getRequestsByWallet(
        req.user.walletAddress,
        pagination
      );

      if (!result.success || !result.data) {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to retrieve collection',
        } as ApiResponse);
        return;
      }

      // Format NFTs for frontend compatibility
      const formattedNFTs = result.data.requests.map(nft => ({
        id: nft._id,
        requestId: nft.requestId,
        name: nft.metadata?.name || 'AI Generated Artwork',
        description: nft.metadata?.description || '',
        price: '0 ETH', // Default since these are generated, not marketplace items
        usdPrice: '$0.00',
        likes: 0, // Would come from a likes system
        views: 0, // Would come from analytics
        chain: this.getChainName(nft.destinationChainId),
        status: this.mapStatusToFrontend(nft.status),
        category: 'Art', // AI generated is always Art category
        rarity: this.calculateRarity(nft.metadata?.attributes?.length || 0),
        dateCreated: nft.createdAt,
        imageUrl: nft.aiGenerationData?.generatedImageUrl,
        metadata: nft.metadata,
        tokenId: nft.blockchainData?.tokenId,
        tokenURI: nft.aiGenerationData?.tokenURI,
        transactionHash: nft.blockchainData?.transactionHash,
      }));

      res.status(200).json({
        success: true,
        data: {
          nfts: formattedNFTs,
          pagination: result.data.pagination,
          totalValue: '0 ETH', // Would calculate from marketplace data
          totalUsdValue: '$0.00',
        },
        message: 'NFT collection retrieved successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error getting user collection', {
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
   * Map backend status to frontend expected status
   */
  private mapStatusToFrontend(status: RequestStatus): string {
    const statusMap: { [key in RequestStatus]: string } = {
      [RequestStatus.PENDING]: 'Processing',
      [RequestStatus.PROCESSING]: 'Processing', 
      [RequestStatus.AI_COMPLETED]: 'Minting',
      [RequestStatus.CROSS_CHAIN_PENDING]: 'Minting',
      [RequestStatus.COMPLETED]: 'Owned',
      [RequestStatus.FAILED]: 'Failed',
      [RequestStatus.CANCELLED]: 'Cancelled',
    };
    return statusMap[status] || 'Unknown';
  }

  /**
   * Calculate rarity based on attributes count
   */
  private calculateRarity(attributeCount: number): string {
    if (attributeCount >= 10) return 'Legendary';
    if (attributeCount >= 8) return 'Epic';
    if (attributeCount >= 6) return 'Rare';
    if (attributeCount >= 4) return 'Uncommon';
    return 'Common';
  }

  /**
   * Like/unlike NFT
   */
  public async toggleLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const { requestId: _requestId } = req.params;

      // For now, just return success - would implement like system
      res.status(200).json({
        success: true,
        data: { liked: true, totalLikes: 1 },
        message: 'NFT liked successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error toggling NFT like', {
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
export const nftRequestController = new NFTRequestController();