import { Request, Response } from 'express';
import { analyticsService } from '@/services/AnalyticsService';
import { AuthenticatedRequest, ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

export class AnalyticsController {
  /**
   * Get dashboard data
   */
  public async getDashboardData(_req: Request, res: Response): Promise<void> {
    try {
      const result = await analyticsService.getDashboardData();

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
      logger.error('Error in getDashboardData controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get platform statistics for a date range
   */
  public async getPlatformStats(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : 
                       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        } as ApiResponse);
        return;
      }

      if (startDate >= endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.getPlatformStats(startDate, endDate);

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
      logger.error('Error in getPlatformStats controller', {
        startDate: req.query['startDate'],
        endDate: req.query['endDate'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get user analytics for the current user
   */
  public async getUserAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        } as ApiResponse);
        return;
      }

      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : 
                       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.getUserAnalytics(req.user._id, startDate, endDate);

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
      logger.error('Error in getUserAnalytics controller', {
        userId: req.user?._id,
        startDate: req.query['startDate'],
        endDate: req.query['endDate'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get top users by various metrics
   */
  public async getTopUsers(req: Request, res: Response): Promise<void> {
    try {
      const metric = req.query['metric'] as 'requests' | 'completed' | 'spent' || 'spent';
      const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 10));

      if (!['requests', 'completed', 'spent'].includes(metric)) {
        res.status(400).json({
          success: false,
          error: 'Invalid metric. Must be requests, completed, or spent',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.getTopUsers(metric, limit);

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
      logger.error('Error in getTopUsers controller', {
        metric: req.query['metric'],
        limit: req.query['limit'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get chain usage statistics
   */
  public async getChainUsageStats(_req: Request, res: Response): Promise<void> {
    try {
      const result = await analyticsService.getChainUsageStats();

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
      logger.error('Error in getChainUsageStats controller', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Generate analytics report
   */
  public async generateAnalyticsReport(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : 
                       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date();
      const reportType = req.query['reportType'] as 'summary' | 'detailed' || 'summary';

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        } as ApiResponse);
        return;
      }

      if (!['summary', 'detailed'].includes(reportType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report type. Must be summary or detailed',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.generateAnalyticsReport(
        startDate,
        endDate,
        reportType
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
        message: `${reportType} analytics report generated successfully`,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in generateAnalyticsReport controller', {
        startDate: req.query['startDate'],
        endDate: req.query['endDate'],
        reportType: req.query['reportType'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Generate daily stats (system/cron only)
   */
  public async generateDailyStats(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();

      if (isNaN(date.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.generateDailyStats(date);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Daily statistics generated successfully',
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in generateDailyStats controller', {
        date: req.query['date'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get analytics for a specific user by wallet (admin only)
   */
  public async getUserAnalyticsByWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : 
                       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        } as ApiResponse);
        return;
      }

      // First get user by wallet
      const { User } = await import('@/models/User');
      const user = await User['findByWallet'](walletAddress!);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        } as ApiResponse);
        return;
      }

      const result = await analyticsService.getUserAnalytics(user._id, startDate, endDate);

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
      logger.error('Error in getUserAnalyticsByWallet controller', {
        walletAddress: req.params['walletAddress'],
        startDate: req.query['startDate'],
        endDate: req.query['endDate'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  }

  /**
   * Get system health status
   */
  public async getSystemHealth(_req: Request, res: Response): Promise<void> {
    try {
      // Basic health checks - in a full implementation, these would test actual connections
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'connected',
          blockchain: 'connected',
          ai: 'connected',
          ipfs: 'connected',
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env['npm_package_version'] || '1.0.0',
      };

      res.status(200).json({
        success: true,
        data: health,
      } as ApiResponse);

    } catch (error) {
      logger.error('Error in getSystemHealth controller', {
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
export const analyticsController = new AnalyticsController();