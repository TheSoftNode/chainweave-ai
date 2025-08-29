import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { collectionController } from '@/controllers/CollectionController';
import { authenticateUser } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Create new collection (authenticated)
router.post(
  '/',
  authenticateUser,
  [
    body('name')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be 1-1000 characters'),
    body('chainId')
      .isInt({ min: 1 })
      .withMessage('Chain ID must be a positive integer'),
    body('contractAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid contract address format'),
    body('royalty')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Royalty must be between 0 and 1000 (0-10%)'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validateRequest,
  collectionController.createCollection
);

// Get current user's collections (authenticated)
router.get('/me', authenticateUser, collectionController.getUserCollections);

// Get featured collections (public)
router.get(
  '/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  collectionController.getFeaturedCollections
);

// Get trending collections (public)
router.get(
  '/trending',
  [
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('Period must be day, week, or month'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  collectionController.getTrendingCollections
);

// Search collections (public)
router.get(
  '/search',
  [
    query('query')
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be 2-100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  collectionController.searchCollections
);

// Get collection by ID (public)
router.get(
  '/id/:collectionId',
  [
    param('collectionId').isMongoId().withMessage('Invalid collection ID'),
  ],
  validateRequest,
  collectionController.getCollectionById
);

// Get collection by contract address (public)
router.get(
  '/contract/:contractAddress',
  [
    param('contractAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid contract address format'),
  ],
  validateRequest,
  collectionController.getCollectionByContract
);

// Get collection statistics (public)
router.get(
  '/:collectionId/stats',
  [
    param('collectionId').isMongoId().withMessage('Invalid collection ID'),
  ],
  validateRequest,
  collectionController.getCollectionStats
);

// Update collection (authenticated, creator only)
router.patch(
  '/:collectionId',
  authenticateUser,
  [
    param('collectionId').isMongoId().withMessage('Invalid collection ID'),
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be 1-1000 characters'),
    body('royalty')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Royalty must be between 0 and 1000 (0-10%)'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validateRequest,
  collectionController.updateCollection
);

// Deactivate collection (authenticated, creator only)
router.delete(
  '/:collectionId',
  authenticateUser,
  [
    param('collectionId').isMongoId().withMessage('Invalid collection ID'),
  ],
  validateRequest,
  collectionController.deactivateCollection
);

// Get collections by chain (public)
router.get(
  '/chain/:chainId',
  [
    param('chainId').isInt({ min: 1 }).withMessage('Invalid chain ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  collectionController.getCollectionsByChain
);

// Get collections by creator wallet (public)
router.get(
  '/creator/:creatorWallet',
  [
    param('creatorWallet')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid creator wallet address format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  collectionController.getCollectionsByCreator
);

// Admin routes (would need admin middleware in production)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString().withMessage('Sort must be a string'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  ],
  validateRequest,
  collectionController.getAllCollections
);

export { router as collectionRoutes };