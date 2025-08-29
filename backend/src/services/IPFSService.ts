import { PinataSDK } from 'pinata';
import axios from 'axios';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';
import { ServiceResponse, NFTMetadata } from '@/types';

interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

export class IPFSService {
  private pinata: PinataSDK;

  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: config.ipfs.pinata.jwt || '',
      pinataGateway: 'https://gateway.pinata.cloud',
    });
    this.testConnection();
  }

  /**
   * Test IPFS connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.pinata.testAuthentication();
      logger.info('IPFS service connected successfully');
    } catch (error) {
      logger.error('Failed to connect to IPFS service:', error);
    }
  }

  /**
   * Upload image from URL to IPFS
   */
  public async uploadImageFromUrl(imageUrl: string): Promise<ServiceResponse<IPFSUploadResult>> {
    try {
      logger.info('Uploading image to IPFS from URL', { imageUrl });

      // Download image from URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';

      // Generate filename based on content
      const hash = require('crypto').createHash('md5').update(imageBuffer).digest('hex');
      const extension = contentType.split('/')[1] || 'png';
      const filename = `chainweave-${hash}.${extension}`;

      // Convert buffer to File and upload with V3 API
      const file = new File([imageBuffer], filename, { type: contentType });
      const result = await this.pinata.upload.public.file(file);

      logger.info('Image uploaded to IPFS successfully', {
        hash: result.cid,
        filename,
        size: imageBuffer.length,
      });

      return {
        success: true,
        data: {
          hash: result.cid,
          url: `ipfs://${result.cid}`,
          size: imageBuffer.length,
        },
      };

    } catch (error) {
      logger.error('Failed to upload image to IPFS', {
        imageUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upload failed',
      };
    }
  }

  /**
   * Upload image buffer to IPFS
   */
  public async uploadImageBuffer(
    buffer: Buffer, 
    filename: string,
    contentType: string = 'image/png'
  ): Promise<ServiceResponse<IPFSUploadResult>> {
    try {
      logger.info('Uploading image buffer to IPFS', { filename, size: buffer.length });

      // Convert buffer to File and upload with V3 API
      const file = new File([buffer], filename, { type: contentType });
      const result = await this.pinata.upload.public.file(file);

      logger.info('Image buffer uploaded to IPFS successfully', {
        hash: result.cid,
        filename,
        size: buffer.length,
      });

      return {
        success: true,
        data: {
          hash: result.cid,
          url: `ipfs://${result.cid}`,
          size: buffer.length,
        },
      };

    } catch (error) {
      logger.error('Failed to upload image buffer to IPFS', {
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image buffer upload failed',
      };
    }
  }

  /**
   * Upload NFT metadata to IPFS
   */
  public async uploadMetadata(metadata: NFTMetadata): Promise<ServiceResponse<IPFSUploadResult>> {
    try {
      logger.info('Uploading metadata to IPFS', { 
        name: metadata.name,
        attributesCount: metadata.attributes?.length || 0,
      });

      // Validate metadata
      const validation = this.validateMetadata(metadata);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
        };
      }

      // Upload metadata as JSON with V3 API
      const result = await this.pinata.upload.public.json(metadata);

      logger.info('Metadata uploaded to IPFS successfully', {
        hash: result.cid,
        name: result.name,
        size: result.size,
      });

      return {
        success: true,
        data: {
          hash: result.cid,
          url: `ipfs://${result.cid}`,
          size: result.size,
        },
      };

    } catch (error) {
      logger.error('Failed to upload metadata to IPFS', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metadata upload failed',
      };
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  public async uploadJSON(
    data: any, 
    filename?: string
  ): Promise<ServiceResponse<IPFSUploadResult>> {
    try {
      // Upload JSON data with V3 API
      const result = await this.pinata.upload.public.json(data);

      logger.info('JSON data uploaded to IPFS successfully', {
        hash: result.cid,
        filename: filename || result.name,
        size: result.size,
      });

      return {
        success: true,
        data: {
          hash: result.cid,
          url: `ipfs://${result.cid}`,
          size: result.size,
        },
      };

    } catch (error) {
      logger.error('Failed to upload JSON to IPFS', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON upload failed',
      };
    }
  }

  /**
   * Retrieve data from IPFS
   */
  public async retrieveData(hash: string): Promise<ServiceResponse<any>> {
    try {
      logger.info('Retrieving data from IPFS', { hash });

      // Use IPFS gateway to retrieve data
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
      
      const response = await axios.get(gatewayUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      logger.info('Data retrieved from IPFS successfully', { 
        hash,
        size: JSON.stringify(response.data).length,
      });

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      logger.error('Failed to retrieve data from IPFS', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'IPFS retrieval failed',
      };
    }
  }

  /**
   * Pin existing hash to ensure permanence (V3 API uses upload.public.cid)
   */
  public async pinHash(hash: string, _metadata?: any): Promise<ServiceResponse<void>> {
    try {
      logger.info('Pinning hash to IPFS', { hash });

      await this.pinata.upload.public.cid(hash);

      logger.info('Hash pinned successfully', { hash });

      return { success: true };

    } catch (error) {
      logger.error('Failed to pin hash', {
        hash,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pin operation failed',
      };
    }
  }

  /**
   * Get files list with filters (V3 API uses files.list)
   */
  public async getPinList(options: {
    status?: 'pinned' | 'unpinned';
    limit?: number;
    offset?: number;
  } = {}): Promise<ServiceResponse<any[]>> {
    try {
      // Note: V3 API doesn't have status filtering like old API
      // All files returned are considered "pinned" since they're stored
      const result = await this.pinata.files.public
        .list()
        .limit(options.limit || 100);

      return {
        success: true,
        data: result.files,
      };

    } catch (error) {
      logger.error('Failed to get files list', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Files list retrieval failed',
      };
    }
  }

  /**
   * Validate NFT metadata structure
   */
  private validateMetadata(metadata: NFTMetadata): { isValid: boolean; error?: string } {
    if (!metadata.name || metadata.name.trim().length === 0) {
      return { isValid: false, error: 'Metadata name is required' };
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      return { isValid: false, error: 'Metadata description is required' };
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      return { isValid: false, error: 'Metadata image is required' };
    }

    // Validate attributes if present
    if (metadata.attributes) {
      for (const attr of metadata.attributes) {
        if (!attr.trait_type || !attr.value) {
          return { isValid: false, error: 'Invalid attribute structure' };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Health check for IPFS service
   */
  public async healthCheck(): Promise<{
    status: 'available' | 'unavailable' | 'error';
    error?: string;
  }> {
    try {
      await this.pinata.testAuthentication();
      
      return { status: 'available' };

    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  public async getStorageStats(): Promise<ServiceResponse<{
    totalFiles: number;
    totalSize: number;
  }>> {
    try {
      const result = await this.pinata.files.public
        .list()
        .limit(1000);

      const totalFiles = result.files.length;
      const totalSize = result.files.reduce((acc: number, file: any) => acc + (file.size || 0), 0);

      return {
        success: true,
        data: {
          totalFiles,
          totalSize,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stats retrieval failed',
      };
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();