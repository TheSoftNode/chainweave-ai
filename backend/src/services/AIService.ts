import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '@/config/env';
import { aiLogger } from '@/utils/logger';
import { AIGenerationRequest, AIGenerationResult, ServiceResponse, NFTMetadata } from '@/types';
import { IPFSService } from './IPFSService';

interface ImageGenerationResponse {
  images: Array<{
    url: string;
    description?: string;
  }>;
  prompt: string;
  model: string;
  processingTime: number;
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private openai: OpenAI | null;
  private ipfsService: IPFSService;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.ai.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.ai.gemini.model });
    this.ipfsService = new IPFSService();
    
    // Initialize OpenAI if API key is provided
    this.openai = config.ai.openai.apiKey 
      ? new OpenAI({ apiKey: config.ai.openai.apiKey })
      : null;
  }

  /**
   * Generate AI artwork and create NFT metadata
   */
  public async generateNFTArtwork(request: AIGenerationRequest): Promise<ServiceResponse<AIGenerationResult>> {
    const startTime = Date.now();
    
    try {
      aiLogger.info('Starting AI artwork generation', {
        prompt: request.prompt.substring(0, 100) + '...',
        style: request.style,
        model: request.model || config.ai.gemini.model,
      });

      // Validate prompt
      const validation = this.validatePrompt(request.prompt);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
        };
      }

      // Generate image using Gemini Pro Vision
      const imageResult = await this.generateImage(request);
      if (!imageResult.success || !imageResult.data) {
        return {
          success: false,
          error: imageResult.error || 'Failed to generate image',
        };
      }

      // Create NFT metadata using Gemini AI
      const metadata = await this.createNFTMetadata(request, imageResult.data);

      // Upload image and metadata to IPFS
      const ipfsResult = await this.uploadToIPFS(imageResult.data.images[0]!.url, metadata);
      if (!ipfsResult.success || !ipfsResult.data) {
        return {
          success: false,
          error: ipfsResult.error || 'Failed to upload to IPFS',
        };
      }

      const processingTime = Date.now() - startTime;

      const result: AIGenerationResult = {
        imageUrl: imageResult.data.images[0]!.url,
        ipfsHash: ipfsResult.data!.imageHash,
        tokenURI: ipfsResult.data!.tokenURI,
        metadata,
        processingTime,
      };

      aiLogger.info('AI artwork generation completed', {
        prompt: request.prompt.substring(0, 50) + '...',
        processingTime,
        ipfsHash: result.ipfsHash,
        tokenURI: result.tokenURI,
      });

      return {
        success: true,
        data: result,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      aiLogger.error('AI artwork generation failed', {
        prompt: request.prompt.substring(0, 50) + '...',
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI generation failed',
      };
    }
  }

  /**
   * Generate image using Google Gemini
   */
  private async generateImage(request: AIGenerationRequest): Promise<ServiceResponse<ImageGenerationResponse>> {
    try {
      // Enhanced prompt for better AI art generation
      const enhancedPrompt = this.enhancePromptForArt(request.prompt, request.style);

      // Generate content with Gemini Pro
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Use the enhanced description to generate actual image with OpenAI DALL-E
      const imageUrl = await this.generateRealImage(request.prompt, text);

      return {
        success: true,
        data: {
          images: [{
            url: imageUrl,
            description: text,
          }],
          prompt: request.prompt,
          model: config.ai.gemini.model,
          processingTime: 0, // Will be calculated by caller
        },
      };

    } catch (error) {
      aiLogger.error('Image generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
      };
    }
  }

  /**
   * Enhance prompt for better art generation
   */
  private enhancePromptForArt(originalPrompt: string, style?: string): string {
    let enhancedPrompt = `Create a detailed artistic description for: ${originalPrompt}`;
    
    if (style) {
      enhancedPrompt += ` in ${style} style`;
    }

    enhancedPrompt += '. Include details about composition, colors, lighting, mood, and artistic elements that would make this a compelling NFT artwork. Focus on visual aesthetics and creative interpretation.';

    return enhancedPrompt;
  }

  /**
   * Generate real image using OpenAI DALL-E API
   */
  private async generateRealImage(prompt: string, description: string): Promise<string> {
    try {
      if (!this.openai) {
        // Fallback to placeholder if OpenAI is not configured
        aiLogger.warn('OpenAI not configured, using placeholder image');
        return this.generateFallbackImage(prompt, description);
      }

      // Create a refined prompt for DALL-E based on the original prompt and Gemini's description
      const dallePrompt = this.createDallePrompt(prompt, description);

      aiLogger.info('Generating image with OpenAI DALL-E', {
        originalPrompt: prompt.substring(0, 50) + '...',
        dallePrompt: dallePrompt.substring(0, 100) + '...',
      });

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      });

      if (!response.data || response.data.length === 0 || !response.data[0]?.url) {
        throw new Error('No image URL returned from OpenAI');
      }

      const imageUrl = response.data[0]!.url;
      
      aiLogger.info('Successfully generated image with OpenAI DALL-E', {
        imageUrl: imageUrl.substring(0, 50) + '...',
        model: 'dall-e-3',
      });

      return imageUrl;

    } catch (error) {
      aiLogger.error('OpenAI DALL-E image generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 50) + '...',
      });

      // Fallback to placeholder on error
      return this.generateFallbackImage(prompt, description);
    }
  }

  /**
   * Create optimized prompt for DALL-E based on user prompt and Gemini description
   */
  private createDallePrompt(originalPrompt: string, geminiDescription: string): string {
    // Combine user intent with AI-enhanced description, but keep it under DALL-E's limit
    let dallePrompt = originalPrompt;
    
    // If Gemini provided a good description, incorporate key elements
    if (geminiDescription && geminiDescription.length > 20) {
      // Extract key artistic elements from Gemini's description
      const artisticElements = this.extractArtisticElements(geminiDescription);
      if (artisticElements) {
        dallePrompt += `, ${artisticElements}`;
      }
    }

    // Add NFT-specific enhancements
    dallePrompt += ', digital art, high quality, detailed, vibrant colors, suitable for NFT collection';

    // Ensure prompt doesn't exceed DALL-E's limit (1000 characters)
    if (dallePrompt.length > 1000) {
      dallePrompt = dallePrompt.substring(0, 997) + '...';
    }

    return dallePrompt;
  }

  /**
   * Extract key artistic elements from Gemini's description
   */
  private extractArtisticElements(description: string): string {
    // Look for artistic terms and combine them
    const artisticKeywords = [
      'composition', 'colors', 'lighting', 'mood', 'style', 'texture',
      'abstract', 'realistic', 'surreal', 'minimalist', 'detailed',
      'vibrant', 'muted', 'bright', 'dark', 'ethereal', 'dramatic'
    ];

    const foundElements: string[] = [];
    const lowerDesc = description.toLowerCase();

    for (const keyword of artisticKeywords) {
      if (lowerDesc.includes(keyword) && foundElements.length < 3) {
        foundElements.push(keyword);
      }
    }

    return foundElements.length > 0 ? foundElements.join(', ') : '';
  }

  /**
   * Generate fallback image when OpenAI is not available
   */
  private generateFallbackImage(prompt: string, description: string): string {
    const hash = Buffer.from(prompt + description).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return `https://api.placeholder-images.com/ai-generated/${hash}.png?prompt=${encodeURIComponent(prompt)}`;
  }

  /**
   * Create NFT metadata from AI generation result using Gemini
   */
  private async createNFTMetadata(request: AIGenerationRequest, imageData: ImageGenerationResponse): Promise<NFTMetadata> {
    const name = await this.generateNFTName(request.prompt);
    const description = await this.generateNFTDescription(request.prompt, imageData.images[0]?.description);

    return {
      name,
      description,
      image: '', // Will be set to IPFS URL later
      attributes: [
        {
          trait_type: 'Style',
          value: request.style || 'AI Generated',
        },
        {
          trait_type: 'Model',
          value: imageData.model,
        },
        {
          trait_type: 'Generation Date',
          value: new Date().toISOString(),
        },
        {
          trait_type: 'Prompt Length',
          value: request.prompt.length,
        },
        {
          trait_type: 'Creator',
          value: 'ChainWeave AI',
        },
        {
          trait_type: 'AI Engine',
          value: 'Google Gemini Pro + OpenAI DALL-E',
        },
      ],
      external_url: 'https://chainweave.ai',
    };
  }

  /**
   * Generate NFT name using Gemini AI
   */
  private async generateNFTName(prompt: string): Promise<string> {
    try {
      const namePrompt = `Generate a creative, catchy NFT collection name (2-4 words max) for this artwork prompt: "${prompt}". The name should be marketable, memorable, and capture the essence of the artwork. Only respond with the name, no explanation.`;
      
      const result = await this.model.generateContent(namePrompt);
      const response = await result.response;
      const aiName = response.text().trim().replace(/['"]/g, '');
      
      return aiName || this.fallbackNFTName(prompt);
    } catch (error) {
      aiLogger.warn('Gemini NFT name generation failed, using fallback', { error });
      return this.fallbackNFTName(prompt);
    }
  }

  /**
   * Fallback NFT name generation
   */
  private fallbackNFTName(prompt: string): string {
    const words = prompt.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 3);

    const baseName = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return baseName || 'AI Generated Artwork';
  }

  /**
   * Generate NFT description using Gemini AI
   */
  private async generateNFTDescription(prompt: string, aiDescription?: string): Promise<string> {
    try {
      const descriptionPrompt = `Create a compelling NFT description for this artwork: "${prompt}". ${aiDescription ? `AI Analysis: ${aiDescription}` : ''} 
      
      Write a professional description that:
      - Captures the artistic vision and meaning
      - Explains the creative process and inspiration  
      - Highlights unique aspects that make it valuable
      - Appeals to NFT collectors and art enthusiasts
      - Is 2-3 paragraphs, engaging but concise
      
      End with: "Created with ChainWeave AI - The premier platform for cross-chain AI NFT generation on ZetaChain."`;
      
      const result = await this.model.generateContent(descriptionPrompt);
      const response = await result.response;
      const aiGeneratedDesc = response.text().trim();
      
      return aiGeneratedDesc || this.fallbackNFTDescription(prompt, aiDescription);
    } catch (error) {
      aiLogger.warn('Gemini NFT description generation failed, using fallback', { error });
      return this.fallbackNFTDescription(prompt, aiDescription);
    }
  }

  /**
   * Fallback NFT description
   */
  private fallbackNFTDescription(prompt: string, aiDescription?: string): string {
    let description = `An AI-generated NFT created from the prompt: "${prompt}"`;
    
    if (aiDescription) {
      description += `\n\nAI Description: ${aiDescription}`;
    }

    description += '\n\nCreated with ChainWeave AI - The premier platform for cross-chain AI NFT generation on ZetaChain.';
    
    return description;
  }

  /**
   * Upload image and metadata to IPFS
   */
  private async uploadToIPFS(imageUrl: string, metadata: NFTMetadata): Promise<ServiceResponse<{
    imageHash: string;
    metadataHash: string;
    tokenURI: string;
  }>> {
    try {
      // Upload image to IPFS
      const imageResult = await this.ipfsService.uploadImageFromUrl(imageUrl);
      if (!imageResult.success || !imageResult.data) {
        return {
          success: false,
          error: imageResult.error || 'Failed to upload image to IPFS',
        };
      }

      // Update metadata with IPFS image URL
      metadata.image = `ipfs://${imageResult.data.hash}`;

      // Upload metadata to IPFS
      const metadataResult = await this.ipfsService.uploadMetadata(metadata);
      if (!metadataResult.success || !metadataResult.data) {
        return {
          success: false,
          error: metadataResult.error || 'Failed to upload metadata to IPFS',
        };
      }

      return {
        success: true,
        data: {
          imageHash: imageResult.data.hash,
          metadataHash: metadataResult.data.hash,
          tokenURI: `ipfs://${metadataResult.data.hash}`,
        },
      };

    } catch (error) {
      aiLogger.error('IPFS upload failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'IPFS upload failed',
      };
    }
  }

  /**
   * Validate AI generation prompt
   */
  private validatePrompt(prompt: string): { isValid: boolean; error?: string } {
    // Check length
    if (prompt.length < config.ai.minPromptLength) {
      return {
        isValid: false,
        error: `Prompt must be at least ${config.ai.minPromptLength} characters long`,
      };
    }

    if (prompt.length > config.ai.maxPromptLength) {
      return {
        isValid: false,
        error: `Prompt cannot exceed ${config.ai.maxPromptLength} characters`,
      };
    }

    // Check for inappropriate content (basic filtering)
    const inappropriateKeywords = ['violence', 'explicit', 'nsfw', 'adult'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const keyword of inappropriateKeywords) {
      if (lowerPrompt.includes(keyword)) {
        return {
          isValid: false,
          error: 'Prompt contains inappropriate content',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate AI-powered prompt suggestions (Gemini feature for hackathon)
   */
  public async generatePromptSuggestions(userInput: string, style?: string): Promise<ServiceResponse<string[]>> {
    try {
      aiLogger.info('Generating prompt suggestions with Gemini', { userInput, style });

      const suggestionPrompt = `Based on this user input: "${userInput}"${style ? ` and ${style} style` : ''}, generate 5 creative and diverse NFT artwork prompts that would create stunning digital art. Each prompt should be:
      - Detailed and descriptive
      - Suitable for NFT creation
      - Unique and marketable
      - Between 10-50 words each
      
      Format as a numbered list (1., 2., etc.) with just the prompt text.`;

      const result = await this.model.generateContent(suggestionPrompt);
      const response = await result.response;
      const suggestions = response.text()
        .split('\n')
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 0)
        .slice(0, 5);

      return {
        success: true,
        data: suggestions.length > 0 ? suggestions : [
          'A majestic phoenix rising from digital flames',
          'Cyberpunk cityscape with neon reflections',
          'Abstract geometric patterns in vibrant colors',
          'Mystical forest with glowing magical creatures',
          'Futuristic robot in a cosmic landscape'
        ],
      };

    } catch (error) {
      aiLogger.error('Failed to generate prompt suggestions', {
        userInput,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Suggestion generation failed',
      };
    }
  }

  /**
   * Analyze user's art preferences using Gemini (hackathon feature)
   */
  public async analyzeArtPreferences(recentPrompts: string[]): Promise<ServiceResponse<{
    dominantThemes: string[];
    suggestedStyles: string[];
    creativityInsights: string;
  }>> {
    try {
      if (recentPrompts.length === 0) {
        return {
          success: false,
          error: 'No prompts provided for analysis',
        };
      }

      const analysisPrompt = `Analyze these recent NFT prompts from a user: ${recentPrompts.join(', ')}
      
      Provide insights in this JSON format:
      {
        "dominantThemes": ["theme1", "theme2", "theme3"],
        "suggestedStyles": ["style1", "style2", "style3"], 
        "creativityInsights": "A brief analysis of the user's artistic preferences and suggestions for expanding their creative horizons"
      }`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text().trim();
      
      try {
        const analysis = JSON.parse(analysisText);
        return {
          success: true,
          data: analysis,
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          success: true,
          data: {
            dominantThemes: ['Abstract', 'Digital Art', 'Creative'],
            suggestedStyles: ['Surreal', 'Minimalist', 'Vibrant'],
            creativityInsights: 'User shows interest in diverse artistic themes. Consider exploring new styles and concepts.',
          },
        };
      }

    } catch (error) {
      aiLogger.error('Failed to analyze art preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  /**
   * Health check for AI service
   */
  public async healthCheck(): Promise<{
    status: 'available' | 'unavailable' | 'error';
    model?: string;
    error?: string;
  }> {
    try {
      // Test with a simple prompt
      const result = await this.model.generateContent('Test prompt for health check');
      const response = await result.response;
      
      if (response.text()) {
        return {
          status: 'available',
          model: config.ai.gemini.model,
        };
      } else {
        return {
          status: 'unavailable',
          error: 'No response from AI model',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();