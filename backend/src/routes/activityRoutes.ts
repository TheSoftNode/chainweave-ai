import { Router } from 'express';
import { ActivityController } from '@/controllers/ActivityController';
import { authenticateUser, optionalAuth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { query } from 'express-validator';

const router = Router();
const activityController = new ActivityController();

// Get activity feed for authenticated user
router.get(
  '/feed',
  authenticateUser,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  ],
  validateRequest,
  activityController.getUserActivityFeed.bind(activityController)
);

// Get public activity feed (recent platform activity)
router.get(
  '/public',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  ],
  validateRequest,
  activityController.getPublicActivityFeed.bind(activityController)
);

// Get notifications for authenticated user
router.get(
  '/notifications',
  authenticateUser,
  [
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean'),
  ],
  validateRequest,
  activityController.getUserNotifications.bind(activityController)
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  authenticateUser,
  activityController.markNotificationRead.bind(activityController)
);

export { router as activityRoutes };