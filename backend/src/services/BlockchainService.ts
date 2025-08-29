import { ethers } from 'ethers';
import { config } from '@/config/env';
import { blockchainLogger } from '@/utils/logger';
import { RequestStatus, ServiceResponse } from '@/types';
import { NFTRequest } from '@/models/NFTRequest';

// ChainWeave contract ABI (simplified for key functions)
const CHAINWEAVE_ABI = [
  'function completeAIGeneration(bytes32 requestId, string memory tokenURI) external',
  'function getMintRequest(bytes32 requestId) external view returns (tuple(bytes32 requestId, address sender, uint256 sourceChainId, uint256 destinationChainId, string prompt, bytes recipient, uint256 timestamp, bool processed, uint256 tokenId, string tokenURI, uint256 fee, uint8 status))',
  'function getRequestFee() external view returns (uint256)',
  'function supportedChains(uint256 chainId) external view returns (bool)',
  'event NFTMintRequested(bytes32 indexed requestId, address indexed sender, uint256 indexed sourceChainId, uint256 destinationChainId, string prompt, bytes recipient, uint256 fee)',
  'event AIGenerationCompleted(bytes32 indexed requestId, string tokenURI)',
  'event NFTMinted(bytes32 indexed requestId, uint256 indexed tokenId, string tokenURI, uint256 destinationChainId)',
  'event NFTMintReverted(bytes32 indexed requestId, string reason)',
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private chainWeaveContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.zetachain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.backendPrivateKey, this.provider);
    this.chainWeaveContract = new ethers.Contract(
      config.blockchain.zetachain.contractAddress,
      CHAINWEAVE_ABI,
      this.wallet
    );

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Verify connection
      const network = await this.provider.getNetwork();
      blockchainLogger.info('Connected to ZetaChain network', {
        chainId: Number(network.chainId),
        networkName: network.name,
        contractAddress: config.blockchain.zetachain.contractAddress,
      });

      // Start listening to contract events
      this.setupEventListeners();
    } catch (error) {
      blockchainLogger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for smart contract events
   */
  private setupEventListeners(): void {
    // Listen for NFT mint requests
    this.chainWeaveContract.on('NFTMintRequested', async (
      requestId: string,
      sender: string,
      sourceChainId: bigint,
      destinationChainId: bigint,
      prompt: string,
      recipient: string,
      fee: bigint,
      event: ethers.Log
    ) => {
      blockchainLogger.info('NFT Mint Request detected', {
        requestId,
        sender,
        destinationChainId: Number(destinationChainId),
        prompt: prompt.substring(0, 50) + '...',
        transactionHash: event.transactionHash,
      });

      await this.handleNewMintRequest({
        requestId,
        sender,
        sourceChainId: Number(sourceChainId),
        destinationChainId: Number(destinationChainId),
        prompt,
        recipient,
        fee: fee.toString(),
        transactionHash: event.transactionHash || '',
      });
    });

    // Listen for NFT mint completions
    this.chainWeaveContract.on('NFTMinted', async (
      requestId: string,
      tokenId: bigint,
      tokenURI: string,
      destinationChainId: bigint,
      event: ethers.Log
    ) => {
      blockchainLogger.info('NFT Mint completed', {
        requestId,
        tokenId: Number(tokenId),
        destinationChainId: Number(destinationChainId),
        transactionHash: event.transactionHash,
      });

      await this.handleMintCompletion(requestId, {
        tokenId: Number(tokenId),
        tokenURI,
        destinationChainId: Number(destinationChainId),
        transactionHash: event.transactionHash || '',
      });
    });

    // Listen for mint reverts/failures
    this.chainWeaveContract.on('NFTMintReverted', async (
      requestId: string,
      reason: string,
      event: ethers.Log
    ) => {
      blockchainLogger.warn('NFT Mint reverted', {
        requestId,
        reason,
        transactionHash: event.transactionHash,
      });

      await this.handleMintFailure(requestId, reason);
    });
  }

  /**
   * Complete AI generation for a request
   */
  public async completeAIGeneration(
    requestId: string, 
    tokenURI: string
  ): Promise<ServiceResponse<{ transactionHash: string }>> {
    try {
      blockchainLogger.info('Completing AI generation on-chain', {
        requestId,
        tokenURI,
      });

      // Estimate gas first
      const estimatedGas = await this.chainWeaveContract['completeAIGeneration']!.estimateGas(
        requestId,
        tokenURI
      );

      // Execute transaction with 20% gas buffer
      const tx = await this.chainWeaveContract['completeAIGeneration']!(
        requestId,
        tokenURI,
        {
          gasLimit: estimatedGas * 120n / 100n,
        }
      );

      blockchainLogger.info('AI generation completion transaction sent', {
        requestId,
        transactionHash: tx.hash,
        gasLimit: estimatedGas.toString(),
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      blockchainLogger.info('AI generation completion confirmed', {
        requestId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      // Update database
      await this.updateRequestBlockchainData(requestId, {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: Number(receipt.gasUsed),
        confirmations: 1,
      });

      return {
        success: true,
        data: { transactionHash: receipt.hash },
      };

    } catch (error) {
      blockchainLogger.error('Failed to complete AI generation on-chain', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown blockchain error',
      };
    }
  }

  /**
   * Get request details from blockchain
   */
  public async getRequestDetails(requestId: string): Promise<ServiceResponse<any>> {
    try {
      const request = await this.chainWeaveContract['getMintRequest']!(requestId);
      
      return {
        success: true,
        data: {
          requestId: request.requestId,
          sender: request.sender,
          sourceChainId: Number(request.sourceChainId),
          destinationChainId: Number(request.destinationChainId),
          prompt: request.prompt,
          recipient: request.recipient,
          timestamp: Number(request.timestamp),
          processed: request.processed,
          tokenId: Number(request.tokenId),
          tokenURI: request.tokenURI,
          fee: request.fee.toString(),
          status: Number(request.status),
        },
      };
    } catch (error) {
      blockchainLogger.error('Failed to get request details', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch request details',
      };
    }
  }

  /**
   * Check if chain is supported
   */
  public async isChainSupported(chainId: number): Promise<boolean> {
    try {
      return await this.chainWeaveContract['supportedChains']!(chainId);
    } catch (error) {
      blockchainLogger.error('Failed to check chain support', { chainId, error });
      return false;
    }
  }

  /**
   * Get current request fee
   */
  public async getRequestFee(): Promise<string> {
    try {
      const fee = await this.chainWeaveContract['getRequestFee']!();
      return fee.toString();
    } catch (error) {
      blockchainLogger.error('Failed to get request fee', { error });
      return '0';
    }
  }

  /**
   * Handle new mint request from blockchain event
   */
  private async handleNewMintRequest(eventData: {
    requestId: string;
    sender: string;
    sourceChainId: number;
    destinationChainId: number;
    prompt: string;
    recipient: string;
    fee: string;
    transactionHash: string;
  }): Promise<void> {
    try {
      // Check if request already exists in database
      const existingRequest = await NFTRequest.findByRequestId(eventData.requestId);
      if (existingRequest) {
        blockchainLogger.warn('Request already exists in database', {
          requestId: eventData.requestId,
        });
        return;
      }

      // Create new request in database
      const nftRequest = new NFTRequest({
        requestId: eventData.requestId,
        walletAddress: eventData.sender,
        prompt: eventData.prompt,
        destinationChainId: eventData.destinationChainId,
        recipient: eventData.recipient,
        status: RequestStatus.PENDING,
        blockchainData: {
          transactionHash: eventData.transactionHash,
        },
      });

      await nftRequest.save();

      blockchainLogger.info('New NFT request saved to database', {
        requestId: eventData.requestId,
        walletAddress: eventData.sender,
      });

    } catch (error) {
      blockchainLogger.error('Failed to handle new mint request', {
        requestId: eventData.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mint completion
   */
  private async handleMintCompletion(
    requestId: string, 
    data: {
      tokenId: number;
      tokenURI: string;
      destinationChainId: number;
      transactionHash: string;
    }
  ): Promise<void> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      if (!request) {
        blockchainLogger.warn('Request not found for mint completion', { requestId });
        return;
      }

      // Update request status and blockchain data
      await request.updateStatus(RequestStatus.COMPLETED);
      await request.setBlockchainData({
        ...request.blockchainData,
        tokenId: data.tokenId,
        transactionHash: data.transactionHash,
      });

      blockchainLogger.info('Request marked as completed', {
        requestId,
        tokenId: data.tokenId,
      });

    } catch (error) {
      blockchainLogger.error('Failed to handle mint completion', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle mint failure
   */
  private async handleMintFailure(requestId: string, reason: string): Promise<void> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      if (!request) {
        blockchainLogger.warn('Request not found for mint failure', { requestId });
        return;
      }

      await request.updateStatus(RequestStatus.FAILED, reason);

      blockchainLogger.info('Request marked as failed', {
        requestId,
        reason,
      });

    } catch (error) {
      blockchainLogger.error('Failed to handle mint failure', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update blockchain data for a request
   */
  private async updateRequestBlockchainData(
    requestId: string, 
    data: Partial<{
      transactionHash: string;
      tokenId: number;
      contractAddress: string;
      gasUsed: number;
      blockNumber: number;
      confirmations: number;
    }>
  ): Promise<void> {
    try {
      const request = await NFTRequest.findByRequestId(requestId);
      if (request) {
        await request.setBlockchainData(data);
      }
    } catch (error) {
      blockchainLogger.error('Failed to update blockchain data', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check for blockchain connection
   */
  public async healthCheck(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    blockNumber?: number;
    chainId?: number;
    error?: string;
  }> {
    try {
      const [blockNumber, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getNetwork(),
      ]);

      return {
        status: 'connected',
        blockNumber,
        chainId: Number(network.chainId),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();