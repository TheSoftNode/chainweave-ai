import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { nftRequestController } from '@/controllers/NFTRequestController';
import { authenticateUser } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Create new NFT request (authenticated)
router.post(
  '/',
  authenticateUser,
  [
    body('prompt')
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Prompt must be 10-1000 characters'),
    body('destinationChainId')
      .isInt({ min: 1 })
      .withMessage('Destination chain ID must be a positive integer'),
    body('recipient')
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Recipient must be a valid wallet address'),
  ],
  validateRequest,
  nftRequestController.createRequest
);

// Get current user's requests (authenticated)
router.get('/me', authenticateUser, nftRequestController.getUserRequests);

// Get user's NFT collection in frontend format (authenticated)
router.get('/collection', authenticateUser, nftRequestController.getUserCollection);

// Like/unlike NFT (authenticated)
router.post('/:requestId/like', authenticateUser, 
  [
    param('requestId').isString().withMessage('Request ID is required'),
  ],
  validateRequest,
  nftRequestController.toggleLike
);

// Get request by ID (public)
router.get(
  '/id/:requestId',
  [
    param('requestId')
      .isString()
      .isLength({ min: 64, max: 64 })
      .matches(/^[a-f0-9]{64}$/)
      .withMessage('Invalid request ID format'),
  ],
  validateRequest,
  nftRequestController.getRequestById
);

// Cancel request (authenticated)
router.patch(
  '/:requestId/cancel',
  authenticateUser,
  [
    param('requestId')
      .isString()
      .isLength({ min: 64, max: 64 })
      .matches(/^[a-f0-9]{64}$/)
      .withMessage('Invalid request ID format'),
  ],
  validateRequest,
  nftRequestController.cancelRequest
);

// Retry failed request (authenticated)
router.patch(
  '/:requestId/retry',
  authenticateUser,
  [
    param('requestId')
      .isString()
      .isLength({ min: 64, max: 64 })
      .matches(/^[a-f0-9]{64}$/)
      .withMessage('Invalid request ID format'),
  ],
  validateRequest,
  nftRequestController.retryRequest
);

// Get requests by wallet address (public)
router.get(
  '/wallet/:walletAddress',
  [
    param('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sort').optional().isString().withMessage('Sort must be a string'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  ],
  validateRequest,
  nftRequestController.getRequestsByWallet
);

// Search requests by prompt (public)
router.get(
  '/search',
  [
    query('query')
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('Search query must be 3-100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  nftRequestController.searchRequests
);

// Admin/System routes (would need admin middleware in production)
router.get(
  '/status/:status',
  [
    param('status')
      .isIn(['pending', 'processing', 'ai_completed', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  nftRequestController.getRequestsByStatus
);

router.get('/stats', nftRequestController.getRequestStatistics);

router.post(
  '/process',
  [
    query('batchSize').optional().isInt({ min: 1, max: 20 }).withMessage('Batch size must be between 1 and 20'),
  ],
  validateRequest,
  nftRequestController.processPendingRequests
);

export { router as nftRequestRoutes };