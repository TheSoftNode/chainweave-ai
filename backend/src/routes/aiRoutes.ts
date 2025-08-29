import { Router } from 'express';
import { AIController } from '@/controllers/AIController';
import { authenticateUser, optionalAuth, rateLimitByUser } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { body } from 'express-validator';

const router = Router();
const aiController = new AIController();

// AI Generation Routes
router.post(
  '/generate',
  authenticateUser,
  rateLimitByUser(5, 60000), // 5 requests per minute
  [
    body('prompt')
      .isString()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Prompt must be between 5 and 1000 characters'),
    body('style')
      .optional()
      .isString()
      .trim()
      .isIn(['digital-art', 'cyberpunk', 'abstract', 'fantasy', 'realistic', 'minimalist', 'surreal', 'vibrant'])
      .withMessage('Invalid style option'),
    body('destinationChainId')
      .isInt({ min: 1 })
      .withMessage('Valid destination chain ID is required'),
    body('recipient')
      .optional()
      .isEthereumAddress()
      .withMessage('Invalid recipient address'),
  ],
  validateRequest,
  aiController.generateNFTArtwork.bind(aiController)
);

// Prompt Suggestions (Gemini AI feature)
router.post(
  '/suggestions',
  optionalAuth,
  rateLimitByUser(10, 60000), // 10 requests per minute
  [
    body('userInput')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('User input must be between 2 and 100 characters'),
    body('style')
      .optional()
      .isString()
      .trim(),
  ],
  validateRequest,
  aiController.generatePromptSuggestions.bind(aiController)
);

// Art Preferences Analysis (Gemini AI feature)
router.get(
  '/preferences',
  authenticateUser,
  aiController.analyzeUserPreferences.bind(aiController)
);

// AI Health Check
router.get('/health', aiController.healthCheck.bind(aiController));

export { router as aiRoutes };