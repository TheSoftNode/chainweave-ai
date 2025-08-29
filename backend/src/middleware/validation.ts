import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Validation middleware that processes express-validator results
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorDetails,
    } as ApiResponse);
    return;
  }

  next();
};

/**
 * Sanitize request body to prevent common injection attacks
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Recursively sanitize object properties
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Basic HTML/script sanitization
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize key names
          const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
          if (cleanKey) {
            sanitized[cleanKey] = sanitizeObject(value);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();

  } catch (error) {
    logger.error('Input sanitization error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    res.status(500).json({
      success: false,
      error: 'Input processing failed',
    } as ApiResponse);
  }
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (page < 1) {
      res.status(400).json({
        success: false,
        error: 'Page must be a positive integer',
      } as ApiResponse);
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
      } as ApiResponse);
      return;
    }

    // Attach validated pagination to request
    req.query.page = page.toString();
    req.query.limit = limit.toString();

    next();

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid pagination parameters',
    } as ApiResponse);
  }
};

/**
 * Validate wallet address format
 */
export const validateWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate Ethereum transaction hash
 */
export const validateTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Content filtering middleware
 * Blocks potentially harmful or inappropriate content
 */
export const filterContent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const checkContent = (text: string): boolean => {
      if (!text || typeof text !== 'string') return true;
      
      // List of prohibited terms/patterns
      const prohibitedPatterns = [
        // Explicit content
        /\b(porn|xxx|sex|naked|nude)\b/i,
        // Violence
        /\b(kill|murder|violence|blood|gore)\b/i,
        // Hate speech
        /\b(hate|racism|nazi|terrorist)\b/i,
        // Spam patterns
        /\b(viagra|casino|lottery|winner)\b/i,
        // Common injection attempts
        /(script|javascript|onload|onerror)/i,
        // SQL injection patterns
        /(union|select|drop|delete|insert|update)\s+(from|into|table)/i,
      ];

      return !prohibitedPatterns.some(pattern => pattern.test(text));
    };

    // Check prompt in NFT requests
    if (req.body?.prompt && !checkContent(req.body.prompt)) {
      res.status(400).json({
        success: false,
        error: 'Content violates community guidelines',
      } as ApiResponse);
      return;
    }

    // Check collection names and descriptions
    if (req.body?.name && !checkContent(req.body.name)) {
      res.status(400).json({
        success: false,
        error: 'Collection name violates community guidelines',
      } as ApiResponse);
      return;
    }

    if (req.body?.description && !checkContent(req.body.description)) {
      res.status(400).json({
        success: false,
        error: 'Description violates community guidelines',
      } as ApiResponse);
      return;
    }

    // Check search queries
    if (req.query?.query && !checkContent(req.query.query as string)) {
      res.status(400).json({
        success: false,
        error: 'Search query violates community guidelines',
      } as ApiResponse);
      return;
    }

    next();

  } catch (error) {
    logger.error('Content filtering error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    res.status(500).json({
      success: false,
      error: 'Content validation failed',
    } as ApiResponse);
  }
};

/**
 * Request size limiter
 */
export const limitRequestSize = (maxSizeBytes: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSizeBytes) {
      res.status(413).json({
        success: false,
        error: 'Request too large',
      } as ApiResponse);
      return;
    }

    next();
  };
};