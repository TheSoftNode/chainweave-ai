import { Router } from 'express';
import { param, query } from 'express-validator';
import { analyticsController } from '@/controllers/AnalyticsController';
import { authenticateUser } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Get dashboard data (public/authenticated)
router.get('/dashboard', analyticsController.getDashboardData);

// Get system health (public)
router.get('/health', analyticsController.getSystemHealth);

// Get platform statistics (public)
router.get(
  '/platform',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
  ],
  validateRequest,
  analyticsController.getPlatformStats
);

// Get current user's analytics (authenticated)
router.get(
  '/me',
  authenticateUser,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
  ],
  validateRequest,
  analyticsController.getUserAnalytics
);

// Get top users (public)
router.get(
  '/users/top',
  [
    query('metric').optional().isIn(['requests', 'completed', 'spent']).withMessage('Metric must be requests, completed, or spent'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  analyticsController.getTopUsers
);

// Get chain usage statistics (public)
router.get('/chains', analyticsController.getChainUsageStats);

// Generate analytics report (admin/authenticated)
router.get(
  '/report',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('reportType').optional().isIn(['summary', 'detailed']).withMessage('Report type must be summary or detailed'),
  ],
  validateRequest,
  analyticsController.generateAnalyticsReport
);

// Admin routes (would need admin middleware in production)
router.post(
  '/generate/daily',
  [
    query('date').optional().isISO8601().withMessage('Date must be in ISO 8601 format'),
  ],
  validateRequest,
  analyticsController.generateDailyStats
);

router.get(
  '/users/:walletAddress',
  [
    param('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
  ],
  validateRequest,
  analyticsController.getUserAnalyticsByWallet
);

export { router as analyticsRoutes };