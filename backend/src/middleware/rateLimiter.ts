import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    } as ApiResponse);
  },
  keyGenerator: (req: Request) => {
    // Use forwarded IP if behind proxy
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests for this endpoint, please try again later.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests for this endpoint, please try again later.',
    } as ApiResponse);
  },
});

/**
 * NFT creation rate limiter
 */
export const nftCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 NFT creation requests per hour
  message: {
    success: false,
    error: 'NFT creation rate limit exceeded. Please wait before creating more NFTs.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('NFT creation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'NFT creation rate limit exceeded. Please wait before creating more NFTs.',
    } as ApiResponse);
  },
});

/**
 * Search rate limiter
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    error: 'Search rate limit exceeded. Please wait before searching again.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    } as ApiResponse);
  },
});

/**
 * Admin rate limiter (more lenient)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit admin IPs to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Admin rate limit exceeded.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});