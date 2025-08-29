import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { AuthenticatedRequest } from '@/types';
import { userService } from '@/services/UserService';
import { generateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';

export class AuthController {
  /**
   * Get authentication challenge for wallet signature
   */
  public async getChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({
          success: false,
          error: 'Valid wallet address is required',
        });
        return;
      }

      // Generate unique challenge message
      const nonce = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const challenge = `Welcome to ChainWeave AI!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      // Store challenge temporarily (in production, use Redis)
      // For now, we'll include it in the response for frontend to sign
      
      res.status(200).json({
        success: true,
        data: {
          challenge,
          nonce,
          timestamp,
        },
        message: 'Authentication challenge generated',
      });

    } catch (error) {
      logger.error('Challenge generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate challenge',
      });
    }
  }

  /**
   * Connect wallet with signature verification
   */
  public async connectWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, signature, challenge, username, email } = req.body;

      logger.info('Wallet connection request with signature', {
        walletAddress,
        username,
        email: email ? 'provided' : 'not provided',
        hasSignature: !!signature,
      });

      // Verify signature if provided (production mode)
      if (signature && challenge) {
        const isValidSignature = await this.verifyWalletSignature(
          walletAddress,
          challenge,
          signature
        );

        if (!isValidSignature) {
          res.status(401).json({
            success: false,
            error: 'Invalid wallet signature',
          });
          return;
        }
      }

      // Create or get user
      const userResult = await userService.createOrGetUser(walletAddress);

      if (!userResult.success || !userResult.data) {
        res.status(500).json({
          success: false,
          error: userResult.error || 'Failed to create/get user',
        });
        return;
      }

      const user = userResult.data;

      // Update user profile if additional data provided
      if (username || email) {
        const updateData: any = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        const updateResult = await userService.updateUser(user._id.toString(), updateData);
        if (!updateResult.success) {
          logger.warn('Failed to update user profile during wallet connection', {
            walletAddress,
            error: updateResult.error,
          });
        }
      }

      // Generate JWT token
      const token = generateToken(walletAddress, user._id.toString());

      logger.info('Wallet connected successfully', {
        walletAddress,
        userId: user._id,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            walletAddress: user.walletAddress,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastActivity: user.updatedAt,
          },
          token,
          expiresIn: '7d',
        },
        message: 'Wallet connected successfully',
      });

    } catch (error) {
      logger.error('Wallet connection failed', {
        walletAddress: req.body.walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Wallet connection failed',
      });
    }
  }

  /**
   * Get current authenticated user profile
   */
  public async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // If user is authenticated, return user data
      if (req.user) {
        res.status(200).json({
          success: true,
          data: {
            user: {
              id: req.user._id,
              walletAddress: req.user.walletAddress,
              username: req.user.username,
              email: req.user.email,
              avatar: req.user.avatar,
              isActive: req.user.isActive,
              createdAt: req.user.createdAt,
              lastActivity: req.user.updatedAt,
              preferences: req.user.preferences,
            },
          },
          message: 'User profile retrieved successfully',
        });
        return;
      }

      // No authentication provided
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });

    } catch (error) {
      logger.error('Get current user failed', {
        userId: req.user?._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user profile',
      });
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided for refresh',
        });
        return;
      }

      // If user is already authenticated via middleware, generate new token
      if (req.user) {
        const newToken = generateToken(req.user.walletAddress, req.user._id.toString());

        logger.info('Token refreshed successfully', {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
        });

        res.status(200).json({
          success: true,
          data: {
            token: newToken,
            expiresIn: '7d',
          },
          message: 'Token refreshed successfully',
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Invalid token for refresh',
      });

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  /**
   * Logout (mainly for cleanup)
   */
  public async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        logger.info('User logout', {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });

    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Verify wallet signature (following hello project patterns)
   */
  private async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Verify signature using ethers
      const signerAddress = ethers.verifyMessage(message, signature);
      
      // Check if recovered address matches provided wallet address
      const isValid = signerAddress.toLowerCase() === walletAddress.toLowerCase();
      
      if (isValid) {
        logger.info('Wallet signature verified successfully', {
          walletAddress,
          signerAddress,
        });
      } else {
        logger.warn('Wallet signature verification failed', {
          walletAddress,
          signerAddress,
        });
      }

      return isValid;

    } catch (error) {
      logger.error('Signature verification error', {
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}