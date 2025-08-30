import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User} from '@/models/User';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';

export interface JWTPayload {
  walletAddress: string;
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Get user from database
    const user = await User.findByWallet(decoded.walletAddress);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated.',
      });
      return;
    }

    // Update last activity
    await user.updateLastActivity();

    // Attach user to request
    req.user = user as any;
    next();

  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      token: req.header('Authorization')?.slice(0, 20) + '...',
    });

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication failed.',
      });
    }
  }
};

/**
 * Generate JWT token for wallet address
 */
export const generateToken = (walletAddress: string, userId: string): string => {
  const payload: JWTPayload = {
    walletAddress,
    userId,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d', // 7 days
  });
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        const user = await User.findByWallet(decoded.walletAddress);
        
        if (user && user.isActive) {
          await user.updateLastActivity();
          req.user = user as any;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        logger.debug('Optional auth token error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    next();

  } catch (error) {
    logger.error('Optional authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(); // Continue without user
  }
};

/**
 * Admin Authentication Middleware
 * Requires user to be authenticated and have admin privileges
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First run regular authentication
  await authenticateUser(req, res, () => {
    if (!req.user) {
      return;
    }

    // Check if user is admin (would need admin field in User model)
    // For now, we'll use a simple check based on wallet address
    const adminWallets = config.admin.wallets.map((w: string) => w.toLowerCase());
    const isAdmin = adminWallets.includes(req.user.walletAddress.toLowerCase());

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
      });
      return;
    }

    next();
  });
};

/**
 * Rate limiting by user
 */
export const rateLimitByUser = (maxRequests: number, windowMs: number = 60000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?._id?.toString();
    const now = Date.now();

    if (!userId) {
      // Apply IP-based rate limiting for unauthenticated requests
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userKey = `ip:${ip}`;
      
      const userRecord = userRequests.get(userKey);
      
      if (!userRecord || now > userRecord.resetTime) {
        userRequests.set(userKey, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (userRecord.count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
        return;
      }

      userRecord.count++;
      next();
      return;
    }

    const userRecord = userRequests.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRecord.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    userRecord.count++;
    next();
  };
};