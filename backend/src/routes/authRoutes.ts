import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { body } from 'express-validator';
import { rateLimitByUser, authenticateUser } from '@/middleware/auth';

const router = Router();
const authController = new AuthController();

// Get authentication challenge
router.post(
  '/challenge',
  rateLimitByUser(20, 60000), // 20 challenges per minute
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid wallet address is required'),
  ],
  validateRequest,
  authController.getChallenge.bind(authController)
);

// Wallet Authentication Routes
router.post(
  '/wallet/connect',
  rateLimitByUser(10, 60000), // 10 attempts per minute
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid wallet address is required'),
    body('signature')
      .optional()
      .isString()
      .isLength({ min: 130, max: 132 })
      .matches(/^0x[a-fA-F0-9]{130}$/)
      .withMessage('Invalid signature format'),
    body('challenge')
      .optional()
      .isString()
      .withMessage('Challenge message is required when signature is provided'),
    body('username')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 alphanumeric characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address required'),
  ],
  validateRequest,
  authController.connectWallet.bind(authController)
);

// Get current user profile
router.get(
  '/profile',
  authenticateUser,
  authController.getCurrentUser.bind(authController)
);

// Refresh token
router.post(
  '/refresh',
  authenticateUser,
  rateLimitByUser(20, 60000), // 20 refresh attempts per minute
  authController.refreshToken.bind(authController)
);

// Logout (optional - mainly for cleanup)
router.post(
  '/logout',
  authenticateUser,
  authController.logout.bind(authController)
);

export { router as authRoutes };