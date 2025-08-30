import { NFTRequest, INFTRequestDocument } from '@/models/NFTRequest';
import { User } from '@/models/User';
import { blockchainService } from './BlockchainService';
import { aiService } from './AIService';
import { 
  INFTRequest, 
  RequestStatus, 
  NFTRequestBody, 
  ServiceResponse, 
  PaginationQuery,
  BlockchainData 
} from '@/types';
import { logger } from '@/utils/logger';

export class NFTRequestService {
  /**
   * Create a new NFT request
   */
  public async createRequest(
    walletAddress: string,
    requestData: NFTRequestBody
  ): Promise<ServiceResponse<INFTRequest>> {
    try {
      logger.info('Creating NFT request', { 
        walletAddress,
        destinationChainId: requestData.destinationChainId,
        promptLength: requestData.prompt.length,
      });

      // Validate user exists
      const user = await User.findByWallet(walletAddress);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Validate chain is supported
      const isSupported = await blockchainService.isChainSupported(requestData.destinationChainId);
      if (!isSupported) {
        return {
          success: false,
          error: 'Destination chain is not supported',
        };
      }

      // Generate unique request ID
      const requestId = this.generateRequestId(walletAddress, requestData.prompt);

      // Create request record
      const nftRequest = new NFTRequest({
        requestId,
        userId: user._id,
        walletAddress: walletAddress.toLowerCase(),
        prompt: requestData.prompt,
        destinationChainId: requestData.destinationChainId,
        recipient: requestData.recipient || walletAddress,
        status: RequestStatus.PENDING,
      });

      await nftRequest.save();

      logger.info('NFT request created successfully', {
        requestId,
        userId: user._id,
        walletAddress,
      });

      return {
        success: true,
        data: nftRequest.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to create NFT request', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create request',
      };
    }
  }

  /**
   * Get request by ID
   */
  public async getRequestById(requestId: string): Promise<ServiceResponse<INFTRequest>> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      
      if (!request) {
        return {
          success: false,
          error: 'Request not found',
        };
      }

      return {
        success: true,
        data: request.toJSON(),
      };

    } catch (error) {
      logger.error('Failed to get request by ID', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve request',
      };
    }
  }

  /**
   * Get requests by wallet address with pagination
   */
  public async getRequestsByWallet(
    walletAddress: string,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<{
    requests: INFTRequest[];
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

      const [requests, totalCount] = await Promise.all([
        NFTRequest.findByWallet(walletAddress, { skip, limit }),
        NFTRequest.countDocuments({ walletAddress: walletAddress.toLowerCase() }),
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
      logger.error('Failed to get requests by wallet', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve requests',
      };
    }
  }

  /**
   * Get requests by status
   */
  public async getRequestsByStatus(
    status: RequestStatus,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<INFTRequest[]>> {
    try {
      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(100, Math.max(1, pagination.limit || 50));

      const requests = await NFTRequest.findByStatus(status, {
        skip: (page - 1) * limit,
        limit,
      });

      return {
        success: true,
        data: requests.map(req => req.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to get requests by status', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve requests',
      };
    }
  }

  /**
   * Process pending requests (AI generation)
   */
  public async processPendingRequests(batchSize: number = 5): Promise<ServiceResponse<{
    processed: number;
    failed: number;
  }>> {
    try {
      logger.info('Processing pending requests', { batchSize });

      const pendingRequests = await NFTRequest.findPendingRequests(batchSize);
      
      if (pendingRequests.length === 0) {
        return {
          success: true,
          data: { processed: 0, failed: 0 },
        };
      }

      let processed = 0;
      let failed = 0;

      // Process requests concurrently with limit
      const processingPromises = pendingRequests.map(async (request) => {
        try {
          await this.processAIGeneration(request);
          processed++;
        } catch (error) {
          logger.error('Failed to process request', {
            requestId: request.requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
          
          // Mark request as failed
          await request.updateStatus(RequestStatus.FAILED, 
            error instanceof Error ? error.message : 'AI generation failed'
          );
        }
      });

      await Promise.all(processingPromises);

      logger.info('Batch processing completed', { processed, failed });

      return {
        success: true,
        data: { processed, failed },
      };

    } catch (error) {
      logger.error('Failed to process pending requests', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Batch processing failed',
      };
    }
  }

  /**
   * Process AI generation for a single request
   */
  private async processAIGeneration(request: INFTRequestDocument): Promise<void> {
    logger.info('Starting AI generation', { requestId: request.requestId });

    // Update status to processing
    await request.updateStatus(RequestStatus.PROCESSING);

    // Generate AI artwork
    const aiResult = await aiService.generateNFTArtwork({
      prompt: request.prompt,
      style: 'artistic', // Can be made configurable
    });

    if (!aiResult.success || !aiResult.data) {
      throw new Error(aiResult.error || 'AI generation failed');
    }

    // Update request with AI generation data
    await request.setAIGenerationData({
      model: 'gemini-pro',
      generatedImageUrl: aiResult.data.imageUrl,
      ipfsHash: aiResult.data.ipfsHash,
      tokenURI: aiResult.data.tokenURI,
      processingTime: aiResult.data.processingTime,
      retryCount: 0,
    });

    await request.setMetadata(aiResult.data.metadata);
    await request.updateStatus(RequestStatus.AI_COMPLETED);

    // Complete AI generation on blockchain
    const blockchainResult = await blockchainService.completeAIGeneration(
      request.requestId,
      aiResult.data.tokenURI
    );

    if (!blockchainResult.success) {
      throw new Error(blockchainResult.error || 'Blockchain completion failed');
    }

    logger.info('AI generation completed successfully', { 
      requestId: request.requestId,
      tokenURI: aiResult.data.tokenURI,
    });
  }

  /**
   * Cancel a request
   */
  public async cancelRequest(
    requestId: string,
    walletAddress: string
  ): Promise<ServiceResponse<void>> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      
      if (!request) {
        return {
          success: false,
          error: 'Request not found',
        };
      }

      if (request.walletAddress !== walletAddress.toLowerCase()) {
        return {
          success: false,
          error: 'Unauthorized: You can only cancel your own requests',
        };
      }

      if (![RequestStatus.PENDING, RequestStatus.PROCESSING].includes(request.status)) {
        return {
          success: false,
          error: 'Request cannot be cancelled in current status',
        };
      }

      await request.updateStatus(RequestStatus.CANCELLED);

      logger.info('Request cancelled successfully', { requestId, walletAddress });

      return { success: true };

    } catch (error) {
      logger.error('Failed to cancel request', {
        requestId,
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to cancel request',
      };
    }
  }

  /**
   * Retry failed request
   */
  public async retryRequest(
    requestId: string,
    walletAddress: string
  ): Promise<ServiceResponse<void>> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      
      if (!request) {
        return {
          success: false,
          error: 'Request not found',
        };
      }

      if (request.walletAddress !== walletAddress.toLowerCase()) {
        return {
          success: false,
          error: 'Unauthorized: You can only retry your own requests',
        };
      }

      if (request.status !== RequestStatus.FAILED) {
        return {
          success: false,
          error: 'Only failed requests can be retried',
        };
      }

      // Check retry count
      const maxRetries = 3;
      const currentRetries = request.aiGenerationData?.retryCount || 0;
      
      if (currentRetries >= maxRetries) {
        return {
          success: false,
          error: 'Maximum retry attempts reached',
        };
      }

      // Reset status and increment retry count
      await request.updateStatus(RequestStatus.PENDING);
      
      if (request.aiGenerationData) {
        await request.setAIGenerationData({
          ...request.aiGenerationData,
          retryCount: currentRetries + 1,
        });
      }

      logger.info('Request marked for retry', { 
        requestId, 
        walletAddress,
        retryCount: currentRetries + 1,
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to retry request', {
        requestId,
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retry request',
      };
    }
  }

  /**
   * Get request statistics
   */
  public async getRequestStatistics(): Promise<ServiceResponse<{
    totalRequests: number;
    byStatus: Array<{ status: string; count: number }>;
    byChain: Array<{ chainId: number; count: number }>;
    recentRequests: number;
  }>> {
    try {
      const [statusStats, chainStats, totalRequests, recentRequests] = await Promise.all([
        NFTRequest.getRequestStats(),
        NFTRequest.aggregate([
          { $group: { _id: '$destinationChainId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        NFTRequest.countDocuments(),
        NFTRequest.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
      ]);

      return {
        success: true,
        data: {
          totalRequests,
          byStatus: statusStats.map(stat => ({ status: stat._id, count: stat.count })),
          byChain: chainStats.map(stat => ({ chainId: stat._id, count: stat.count })),
          recentRequests,
        },
      };

    } catch (error) {
      logger.error('Failed to get request statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to retrieve statistics',
      };
    }
  }

  /**
   * Search requests by prompt
   */
  public async searchRequests(
    query: string,
    pagination: PaginationQuery = {}
  ): Promise<ServiceResponse<INFTRequest[]>> {
    try {
      if (!query || query.trim().length < 3) {
        return {
          success: false,
          error: 'Search query must be at least 3 characters',
        };
      }

      const page = Math.max(1, pagination.page || 1);
      const limit = Math.min(50, Math.max(1, pagination.limit || 20));
      const skip = (page - 1) * limit;

      const requests = await NFTRequest.find({
        $text: { $search: query }
      })
      .populate('userId', 'walletAddress username')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

      return {
        success: true,
        data: requests.map(req => req.toJSON()),
      };

    } catch (error) {
      logger.error('Failed to search requests', {
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
   * Generate unique request ID
   */
  private generateRequestId(walletAddress: string, prompt: string): string {
    const crypto = require('crypto');
    const timestamp = Date.now().toString();
    const data = `${walletAddress}-${prompt}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Update request blockchain data (called by blockchain service)
   */
  public async updateRequestBlockchainData(
    requestId: string,
    blockchainData: Partial<BlockchainData>
  ): Promise<ServiceResponse<void>> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      
      if (!request) {
        return {
          success: false,
          error: 'Request not found',
        };
      }

      await request.setBlockchainData(blockchainData);

      return { success: true };

    } catch (error) {
      logger.error('Failed to update blockchain data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to update blockchain data',
      };
    }
  }

  /**
   * Mark request as completed (called by blockchain service)
   */
  public async completeRequest(
    requestId: string,
    tokenId: number
  ): Promise<ServiceResponse<void>> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      
      if (!request) {
        return {
          success: false,
          error: 'Request not found',
        };
      }

      await request.setBlockchainData({
        ...request.blockchainData,
        tokenId,
      });

      await request.updateStatus(RequestStatus.COMPLETED);

      logger.info('Request completed successfully', { requestId, tokenId });

      return { success: true };

    } catch (error) {
      logger.error('Failed to complete request', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to complete request',
      };
    }
  }
}

// Export singleton instance
export const nftRequestService = new NFTRequestService();