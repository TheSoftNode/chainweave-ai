import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import { aiService } from '@/services/AIService';
import { nftRequestService } from '@/services/NFTRequestService';
import { logger } from '@/utils/logger';

export class AIController {
  /**
   * Generate NFT artwork using AI
   */
  public async generateNFTArtwork(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { prompt, style, destinationChainId, recipient } = req.body;
      const walletAddress = req.user!.walletAddress;

      logger.info('AI artwork generation request', {
        walletAddress,
        prompt: prompt.substring(0, 50) + '...',
        style,
        destinationChainId,
      });

      // Create NFT request first
      const requestResult = await nftRequestService.createRequest(walletAddress, {
        prompt,
        destinationChainId,
        recipient: recipient || walletAddress,
      });

      if (!requestResult.success || !requestResult.data) {
        res.status(400).json({
          success: false,
          error: requestResult.error || 'Failed to create NFT request',
        });
        return;
      }

      // Generate AI artwork
      const aiResult = await aiService.generateNFTArtwork({
        prompt,
        style: style || 'digital-art',
      });

      if (!aiResult.success || !aiResult.data) {
        res.status(500).json({
          success: false,
          error: aiResult.error || 'AI generation failed',
        });
        return;
      }

      // Return response in format expected by frontend
      res.status(200).json({
        success: true,
        data: {
          requestId: requestResult.data._id,
          artwork: {
            imageUrl: aiResult.data.imageUrl,
            ipfsHash: aiResult.data.ipfsHash,
            tokenURI: aiResult.data.tokenURI,
            metadata: aiResult.data.metadata,
            processingTime: aiResult.data.processingTime,
          },
          request: requestResult.data,
        },
        message: 'AI artwork generated successfully',
      });

    } catch (error) {
      logger.error('AI artwork generation failed', {
        walletAddress: req.user?.walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error during AI generation',
      });
    }
  }

  /**
   * Generate prompt suggestions using Gemini AI
   */
  public async generatePromptSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userInput, style } = req.body;

      logger.info('Generating prompt suggestions', {
        userInput,
        style,
        authenticated: !!req.user,
      });

      const suggestions = await aiService.generatePromptSuggestions(userInput, style);

      if (!suggestions.success) {
        res.status(500).json({
          success: false,
          error: suggestions.error || 'Failed to generate suggestions',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          suggestions: suggestions.data,
          userInput,
          style,
        },
        message: 'Prompt suggestions generated successfully',
      });

    } catch (error) {
      logger.error('Prompt suggestion generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error during suggestion generation',
      });
    }
  }

  /**
   * Analyze user's art preferences using Gemini AI
   */
  public async analyzeUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletAddress = req.user!.walletAddress;

      logger.info('Analyzing user art preferences', { walletAddress });

      // Get user's recent prompts
      const requestsResult = await nftRequestService.getRequestsByWallet(walletAddress, {
        limit: 10,
        page: 1,
      });

      if (!requestsResult.success || !requestsResult.data) {
        res.status(400).json({
          success: false,
          error: 'Failed to retrieve user requests',
        });
        return;
      }

      const recentPrompts = requestsResult.data.requests
        .map(request => request.prompt)
        .filter(prompt => prompt && prompt.length > 0);

      if (recentPrompts.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No recent prompts found for analysis',
        });
        return;
      }

      const analysis = await aiService.analyzeArtPreferences(recentPrompts);

      if (!analysis.success) {
        res.status(500).json({
          success: false,
          error: analysis.error || 'Failed to analyze preferences',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...analysis.data,
          analyzedPrompts: recentPrompts.length,
          walletAddress,
        },
        message: 'Art preferences analyzed successfully',
      });

    } catch (error) {
      logger.error('Art preferences analysis failed', {
        walletAddress: req.user?.walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error during preference analysis',
      });
    }
  }

  /**
   * AI service health check
   */
  public async healthCheck(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const health = await aiService.healthCheck();

      res.status(health.status === 'available' ? 200 : 503).json({
        success: health.status === 'available',
        data: {
          status: health.status,
          model: health.model,
          timestamp: new Date().toISOString(),
        },
        error: health.error,
      });

    } catch (error) {
      logger.error('AI health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Health check failed',
      });
    }
  }
}