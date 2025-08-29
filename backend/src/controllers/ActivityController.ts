import { Response } from 'express';
import { AuthenticatedRequest, PaginationQuery } from '@/types';
import { nftRequestService } from '@/services/NFTRequestService';
import { userService } from '@/services/UserService';
import { logger } from '@/utils/logger';

interface ActivityItem {
  id: number;
  type: 'sale' | 'mint' | 'like' | 'listing' | 'offer' | 'view' | 'transfer' | 'price_update';
  title: string;
  description: string;
  timestamp: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  nft: string;
  buyer?: string;
  chain: string;
  hash: string | undefined;
}

export class ActivityController {
  /**
   * Get user's activity feed
   */
  public async getUserActivityFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
      };

      logger.info('Getting user activity feed', {
        userId: req.user._id,
        pagination,
      });

      // Get user's NFT requests as activity
      const requestsResult = await nftRequestService.getRequestsByWallet(
        req.user.walletAddress,
        pagination
      );

      if (!requestsResult.success || !requestsResult.data) {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve activity feed',
        });
        return;
      }

      // Transform requests into activity items
      const activities: ActivityItem[] = requestsResult.data.requests.map((request, index) => ({
        id: index + 1,
        type: this.getActivityType(request.status),
        title: this.getActivityTitle(request.status, request.metadata?.name),
        description: this.getActivityDescription(request.status, request.prompt),
        timestamp: new Date(request.createdAt).toISOString(),
        value: request.fee ? `${request.fee} ETH` : '0.001 ETH',
        trend: 'neutral' as const,
        nft: request.metadata?.name || 'AI Generated Artwork',
        chain: this.getChainName(request.destinationChainId),
        hash: request.blockchainData?.transactionHash,
      }));

      res.status(200).json({
        success: true,
        data: {
          activities,
          pagination: requestsResult.data.pagination,
        },
        message: 'Activity feed retrieved successfully',
      });

    } catch (error) {
      logger.error('Error getting user activity feed', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve activity feed',
      });
    }
  }

  /**
   * Get public activity feed
   */
  public async getPublicActivityFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pagination: PaginationQuery = {
        page: parseInt(req.query['page'] as string) || 1,
        limit: parseInt(req.query['limit'] as string) || 20,
      };

      logger.info('Getting public activity feed', { pagination });

      // Get recent completed NFT requests as public activity
      const statsResult = await nftRequestService.getRequestStatistics();

      if (!statsResult.success || !statsResult.data) {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve public activity',
        });
        return;
      }

      // Create mock public activities for now
      const activities: ActivityItem[] = [
        {
          id: 1,
          type: 'mint',
          title: 'New AI NFT Minted',
          description: 'Cosmic Dragon created with Gemini AI',
          timestamp: new Date().toISOString(),
          value: '0.001 ETH',
          trend: 'up',
          nft: 'Cosmic Dragon #001',
          chain: 'ZetaChain',
          hash: '0x1234...abcd',
        },
        // Would populate with real data from recent completed requests
      ];

      res.status(200).json({
        success: true,
        data: {
          activities,
          stats: statsResult.data,
        },
        message: 'Public activity feed retrieved successfully',
      });

    } catch (error) {
      logger.error('Error getting public activity feed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve public activity',
      });
    }
  }

  /**
   * Get user notifications
   */
  public async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      // Get user stats to create personalized notifications
      const userStats = await userService.getUserStats(req.user._id.toString());
      
      const notifications = [
        {
          id: 1,
          type: 'success',
          title: 'NFT Generation Complete',
          message: 'Your AI-generated NFT "Cosmic Dragon" has been minted successfully!',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/dashboard/collection',
        },
        {
          id: 2,
          type: 'info',
          title: 'Welcome to ChainWeave AI',
          message: `You have created ${userStats.success ? userStats.data?.completedRequests || 0 : 0} NFTs so far. Start creating more amazing AI-powered NFTs with Google Gemini AI!`,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          read: false,
          actionUrl: '/ai/generate',
        },
      ];

      if (userStats.success && userStats.data && userStats.data.completedRequests >= 5) {
        notifications.push({
          id: 3,
          type: 'achievement',
          title: 'NFT Creator Badge Unlocked!',
          message: `Congratulations! You've created ${userStats.data.completedRequests} AI NFTs. You're becoming a true digital artist!`,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          read: false,
          actionUrl: '/dashboard/achievements',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
        },
        message: 'Notifications retrieved successfully',
      });

    } catch (error) {
      logger.error('Error getting user notifications', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notifications',
      });
    }
  }

  /**
   * Mark notification as read
   */
  public async markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const { notificationId } = req.params;

      // For now, just return success - would implement notification system
      logger.info('Notification marked as read', {
        userId: req.user._id,
        notificationId,
      });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });

    } catch (error) {
      logger.error('Error marking notification as read', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  }

  /**
   * Helper methods
   */
  private getActivityType(status: string): ActivityItem['type'] {
    switch (status) {
      case 'completed': return 'mint';
      case 'pending': return 'listing';
      case 'processing': return 'view';
      default: return 'view';
    }
  }

  private getActivityTitle(status: string, nftName?: string): string {
    const name = nftName || 'AI Generated Artwork';
    switch (status) {
      case 'completed': return `${name} Minted Successfully`;
      case 'pending': return `${name} Generation Started`;
      case 'processing': return `${name} AI Processing`;
      case 'failed': return `${name} Generation Failed`;
      default: return `${name} Activity`;
    }
  }

  private getActivityDescription(status: string, prompt: string): string {
    const shortPrompt = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    switch (status) {
      case 'completed': return `NFT created from prompt: "${shortPrompt}"`;
      case 'pending': return `Generating NFT from: "${shortPrompt}"`;
      case 'processing': return `AI processing: "${shortPrompt}"`;
      case 'failed': return `Generation failed for: "${shortPrompt}"`;
      default: return `Activity for: "${shortPrompt}"`;
    }
  }

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
}