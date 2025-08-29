import { Router } from 'express';
import { body, param } from 'express-validator';
import { userController } from '@/controllers/UserController';
import { authenticateUser } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';

const router = Router();

// Create or get user (public)
router.post(
  '/wallet',
  [
    body('walletAddress')
      .isString()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.createOrGetUser
);

// Get current user profile (authenticated)
router.get('/me', authenticateUser, userController.getCurrentUser);

// Get user statistics for current user (authenticated)
router.get('/me/stats', authenticateUser, userController.getUserStats);

// Get current user's NFT history (authenticated)
router.get('/me/nfts', authenticateUser, userController.getUserNFTHistory);

// Update current user profile (authenticated)
router.patch(
  '/me',
  authenticateUser,
  [
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('username').optional().isString().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('avatar').optional().isString().isURL().withMessage('Avatar must be a valid URL'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object'),
    body('preferences.publicProfile').optional().isBoolean().withMessage('publicProfile must be a boolean'),
    body('preferences.emailNotifications').optional().isBoolean().withMessage('emailNotifications must be a boolean'),
    body('preferences.theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  ],
  validateRequest,
  userController.updateUser
);

// Deactivate current user account (authenticated)
router.delete('/me', authenticateUser, userController.deactivateUser);

// Get user by ID (public)
router.get(
  '/id/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  userController.getUserById
);

// Get user by wallet address (public)
router.get(
  '/wallet/:walletAddress',
  [
    param('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getUserByWallet
);

// Get user's public statistics by wallet (public)
router.get(
  '/wallet/:walletAddress/stats',
  [
    param('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getUserStatsByWallet
);

// Get user's public NFT history by wallet (public)
router.get(
  '/wallet/:walletAddress/nfts',
  [
    param('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
  ],
  validateRequest,
  userController.getPublicNFTHistory
);

// Admin routes (would need admin middleware in production)
router.get('/search', userController.searchUsers);
router.get('/', userController.getAllUsers);

export { router as userRoutes };