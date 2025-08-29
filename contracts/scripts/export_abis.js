const fs = require('fs');
const path = require('path');

/**
 * Export contract ABIs and addresses for frontend integration
 */
async function main() {
  console.log("\n📦 Exporting contract ABIs for frontend integration...\n");

  try {
    // Get contract artifacts
    const chainWeaveArtifact = await hre.artifacts.readArtifact("ChainWeave");
    const crossChainMinterArtifact = await hre.artifacts.readArtifact("CrossChainMinter");

    // Prepare contract data for export
    const contractData = {
      ChainWeave: {
        abi: chainWeaveArtifact.abi,
        bytecode: chainWeaveArtifact.bytecode,
        networks: {
          // ZetaChain networks
          zetachain_testnet: {
            address: "", // To be filled after deployment
            chainId: 7001,
            name: "ZetaChain Athens Testnet"
          },
          zetachain_mainnet: {
            address: "", // To be filled after deployment
            chainId: 7000,
            name: "ZetaChain Mainnet"
          }
        }
      },
      CrossChainMinter: {
        abi: crossChainMinterArtifact.abi,
        bytecode: crossChainMinterArtifact.bytecode,
        networks: {
          // Ethereum
          ethereum_sepolia: {
            address: "", // To be filled after deployment
            chainId: 11155111,
            name: "Ethereum Sepolia",
            nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
            blockExplorer: "https://sepolia.etherscan.io"
          },
          ethereum_mainnet: {
            address: "", // To be filled after deployment
            chainId: 1,
            name: "Ethereum Mainnet",
            nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
            blockExplorer: "https://etherscan.io"
          },
          // Base
          base_sepolia: {
            address: "", // To be filled after deployment
            chainId: 84532,
            name: "Base Sepolia",
            nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
            blockExplorer: "https://sepolia.basescan.org"
          },
          base_mainnet: {
            address: "", // To be filled after deployment
            chainId: 8453,
            name: "Base Mainnet",
            nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
            blockExplorer: "https://basescan.org"
          },
          // BSC
          bsc_testnet: {
            address: "", // To be filled after deployment
            chainId: 97,
            name: "BSC Testnet",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            blockExplorer: "https://testnet.bscscan.com"
          },
          bsc_mainnet: {
            address: "", // To be filled after deployment
            chainId: 56,
            name: "BSC Mainnet",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            blockExplorer: "https://bscscan.com"
          },
          // Polygon
          polygon_amoy: {
            address: "", // To be filled after deployment
            chainId: 80002,
            name: "Polygon Amoy",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            blockExplorer: "https://amoy.polygonscan.com"
          },
          polygon_mainnet: {
            address: "", // To be filled after deployment
            chainId: 137,
            name: "Polygon Mainnet",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            blockExplorer: "https://polygonscan.com"
          }
        }
      }
    };

    // Add metadata
    const exportData = {
      name: "ChainWeave AI",
      description: "Cross-chain AI NFT generation platform powered by ZetaChain",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      compiler: {
        solidity: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      networks: {
        testnet: {
          zetachain: 7001,
          ethereum: 11155111,
          base: 84532,
          bsc: 97,
          polygon: 80002
        },
        mainnet: {
          zetachain: 7000,
          ethereum: 1,
          base: 8453,
          bsc: 56,
          polygon: 137
        }
      },
      contracts: contractData
    };

    // Create exports directory
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Write main export file
    const exportPath = path.join(exportsDir, 'contracts.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log("✅ Main contract data exported to:", exportPath);

    // Write individual ABI files for easier frontend consumption
    const abiDir = path.join(exportsDir, 'abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }

    // ChainWeave ABI
    const chainWeaveAbiPath = path.join(abiDir, 'ChainWeave.json');
    fs.writeFileSync(chainWeaveAbiPath, JSON.stringify(chainWeaveArtifact.abi, null, 2));
    console.log("✅ ChainWeave ABI exported to:", chainWeaveAbiPath);

    // CrossChainMinter ABI
    const crossChainMinterAbiPath = path.join(abiDir, 'CrossChainMinter.json');
    fs.writeFileSync(crossChainMinterAbiPath, JSON.stringify(crossChainMinterArtifact.abi, null, 2));
    console.log("✅ CrossChainMinter ABI exported to:", crossChainMinterAbiPath);

    // Create TypeScript type definitions
    const typesDir = path.join(exportsDir, 'types');
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }

    // Generate TypeScript interfaces
    const typeDefinitions = `
// Auto-generated TypeScript definitions for ChainWeave AI contracts
// Generated at: ${new Date().toISOString()}

export interface ChainWeaveABI extends Array<any> {}
export interface CrossChainMinterABI extends Array<any> {}

export interface NetworkConfig {
  address: string;
  chainId: number;
  name: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
}

export interface ContractConfig {
  abi: any[];
  bytecode: string;
  networks: Record<string, NetworkConfig>;
}

export interface ContractExports {
  name: string;
  description: string;
  version: string;
  timestamp: string;
  compiler: {
    solidity: string;
    settings: {
      optimizer: {
        enabled: boolean;
        runs: number;
      };
    };
  };
  networks: {
    testnet: Record<string, number>;
    mainnet: Record<string, number>;
  };
  contracts: {
    ChainWeave: ContractConfig;
    CrossChainMinter: ContractConfig;
  };
}

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  testnet: {
    chainWeave: "", // ZetaChain Athens
    minters: {
      ethereum: "", // Ethereum Sepolia
      base: "",     // Base Sepolia
      bsc: "",      // BSC Testnet
      polygon: ""   // Polygon Amoy
    }
  },
  mainnet: {
    chainWeave: "", // ZetaChain Mainnet
    minters: {
      ethereum: "", // Ethereum Mainnet
      base: "",     // Base Mainnet
      bsc: "",      // BSC Mainnet
      polygon: ""   // Polygon Mainnet
    }
  }
} as const;

// Supported chain IDs
export const SUPPORTED_CHAINS = {
  testnet: [7001, 11155111, 84532, 97, 80002],
  mainnet: [7000, 1, 8453, 56, 137]
} as const;

// Chain metadata
export const CHAIN_METADATA = {
  7001: { name: "ZetaChain Athens", symbol: "ZETA", isTestnet: true },
  7000: { name: "ZetaChain Mainnet", symbol: "ZETA", isTestnet: false },
  11155111: { name: "Ethereum Sepolia", symbol: "ETH", isTestnet: true },
  1: { name: "Ethereum Mainnet", symbol: "ETH", isTestnet: false },
  84532: { name: "Base Sepolia", symbol: "ETH", isTestnet: true },
  8453: { name: "Base Mainnet", symbol: "ETH", isTestnet: false },
  97: { name: "BSC Testnet", symbol: "BNB", isTestnet: true },
  56: { name: "BSC Mainnet", symbol: "BNB", isTestnet: false },
  80002: { name: "Polygon Amoy", symbol: "MATIC", isTestnet: true },
  137: { name: "Polygon Mainnet", symbol: "MATIC", isTestnet: false }
} as const;

export type ChainId = keyof typeof CHAIN_METADATA;
export type TestnetChainId = 7001 | 11155111 | 84532 | 97 | 80002;
export type MainnetChainId = 7000 | 1 | 8453 | 56 | 137;
    `;

    const typesPath = path.join(typesDir, 'contracts.ts');
    fs.writeFileSync(typesPath, typeDefinitions.trim());
    console.log("✅ TypeScript types exported to:", typesPath);

    // Create frontend integration guide
    const docsDir = path.join(exportsDir, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const integrationGuide = `
# ChainWeave AI Frontend Integration Guide

## Overview
This guide helps you integrate ChainWeave AI contracts into your frontend application.

## Installation

### For React/Next.js projects:
\`\`\`bash
npm install ethers @zetachain/toolkit wagmi viem
\`\`\`

### For Vue.js projects:
\`\`\`bash
npm install ethers @zetachain/toolkit
\`\`\`

## Basic Setup

### 1. Import Contract Data
\`\`\`typescript
import contractData from './exports/contracts.json';
import { ChainWeaveABI, CrossChainMinterABI } from './exports/types/contracts';
\`\`\`

### 2. Setup Ethers.js
\`\`\`typescript
import { ethers } from 'ethers';

// Connect to ZetaChain for ChainWeave contract
const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
const chainWeaveContract = new ethers.Contract(
  contractData.contracts.ChainWeave.networks.zetachain_testnet.address,
  contractData.contracts.ChainWeave.abi,
  zetaProvider
);

// Connect to destination chain for CrossChainMinter
const ethProvider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
const minterContract = new ethers.Contract(
  contractData.contracts.CrossChainMinter.networks.ethereum_sepolia.address,
  contractData.contracts.CrossChainMinter.abi,
  ethProvider
);
\`\`\`

### 3. Request NFT Mint
\`\`\`typescript
async function requestNFTMint(prompt: string, destinationChainId: number, recipient: string) {
  const signer = await provider.getSigner();
  const contract = chainWeaveContract.connect(signer);
  
  const recipientBytes = ethers.solidityPacked(['address'], [recipient]);
  
  const tx = await contract.requestNFTMint(
    prompt,
    destinationChainId,
    recipientBytes
  );
  
  const receipt = await tx.wait();
  
  // Extract request ID from event
  const event = receipt.logs.find(log => 
    contract.interface.parseLog(log)?.name === 'NFTMintRequested'
  );
  
  return contract.interface.parseLog(event).args.requestId;
}
\`\`\`

### 4. Check Mint Status
\`\`\`typescript
async function getMintStatus(requestId: string) {
  const status = await chainWeaveContract.getMintStatus(requestId);
  return {
    status: status.status,
    tokenId: status.tokenId.toString(),
    tokenURI: status.tokenURI
  };
}
\`\`\`

### 5. Get User NFT History
\`\`\`typescript
async function getUserNFTs(userAddress: string) {
  const history = await chainWeaveContract.getUserNFTHistory(userAddress);
  
  return history.requestIds.map((requestId, index) => ({
    requestId,
    chainId: history.chainIds[index].toString(),
    tokenId: history.tokenIds[index].toString()
  }));
}
\`\`\`

## Wagmi Hook Examples (React)

### 1. Setup Wagmi Config
\`\`\`typescript
import { createConfig, http } from 'wagmi';
import { zetachain, sepolia, base, bsc, polygon } from 'wagmi/chains';

export const config = createConfig({
  chains: [zetachain, sepolia, base, bsc, polygon],
  transports: {
    [zetachain.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
});
\`\`\`

### 2. Request NFT Hook
\`\`\`typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export function useRequestNFT() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const requestNFT = (prompt: string, chainId: number, recipient: string) => {
    const recipientBytes = ethers.solidityPacked(['address'], [recipient]);
    
    writeContract({
      address: contractData.contracts.ChainWeave.networks.zetachain_testnet.address,
      abi: contractData.contracts.ChainWeave.abi,
      functionName: 'requestNFTMint',
      args: [prompt, chainId, recipientBytes],
    });
  };

  return {
    requestNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess
  };
}
\`\`\`

### 3. Read Contract Hook
\`\`\`typescript
import { useReadContract } from 'wagmi';

export function useMintStatus(requestId: string) {
  return useReadContract({
    address: contractData.contracts.ChainWeave.networks.zetachain_testnet.address,
    abi: contractData.contracts.ChainWeave.abi,
    functionName: 'getMintStatus',
    args: [requestId],
  });
}
\`\`\`

## Error Handling

\`\`\`typescript
try {
  const requestId = await requestNFTMint(prompt, chainId, recipient);
  console.log('NFT mint requested:', requestId);
} catch (error) {
  if (error.code === 'UNSUPPORTED_CHAIN') {
    console.error('Chain not supported');
  } else if (error.code === 'INSUFFICIENT_PAYMENT') {
    console.error('Insufficient payment for minting');
  } else {
    console.error('Unknown error:', error.message);
  }
}
\`\`\`

## Contract Addresses

Update these addresses after deployment:

### Testnet
- **ChainWeave (ZetaChain Athens)**: \`TBD\`
- **Ethereum Sepolia Minter**: \`TBD\`
- **Base Sepolia Minter**: \`TBD\`
- **BSC Testnet Minter**: \`TBD\`
- **Polygon Amoy Minter**: \`TBD\`

### Mainnet
- **ChainWeave (ZetaChain Mainnet)**: \`TBD\`
- **Ethereum Mainnet Minter**: \`TBD\`
- **Base Mainnet Minter**: \`TBD\`
- **BSC Mainnet Minter**: \`TBD\`
- **Polygon Mainnet Minter**: \`TBD\`

## Support
For technical support and questions, please refer to:
- [ZetaChain Documentation](https://docs.zetachain.com)
- [ChainWeave AI Repository](https://github.com/chainweave-ai)
- [Discord Community](https://discord.gg/zetachain)
    `;

    const guidePath = path.join(docsDir, 'frontend-integration.md');
    fs.writeFileSync(guidePath, integrationGuide.trim());
    console.log("✅ Integration guide exported to:", guidePath);

    // Create package.json for npm publishing (optional)
    const packageJson = {
      name: "@chainweave/contracts",
      version: "1.0.0",
      description: "Smart contract ABIs and types for ChainWeave AI",
      main: "contracts.json",
      types: "types/contracts.ts",
      files: [
        "contracts.json",
        "abis/*.json",
        "types/*.ts",
        "docs/*.md"
      ],
      keywords: [
        "chainweave",
        "ai",
        "nft",
        "cross-chain",
        "zetachain",
        "smart-contracts"
      ],
      author: "ChainWeave AI Team",
      license: "MIT",
      repository: {
        type: "git",
        url: "https://github.com/chainweave-ai/contracts"
      }
    };

    const packagePath = path.join(exportsDir, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log("✅ Package.json exported to:", packagePath);

    // Summary
    console.log("\n📋 Export Summary:");
    console.log("==================");
    console.log("Main export file:", exportPath);
    console.log("ABI files:", abiDir);
    console.log("TypeScript types:", typesDir);
    console.log("Documentation:", docsDir);
    console.log("Package config:", packagePath);

    console.log("\n📝 Next Steps:");
    console.log("1. Deploy contracts and update addresses in contracts.json");
    console.log("2. Copy exports to frontend project");
    console.log("3. Install required dependencies in frontend");
    console.log("4. Follow integration guide for implementation");
    console.log("5. Test cross-chain minting functionality");

  } catch (error) {
    console.error("\n❌ Export failed:", error.message);
    process.exit(1);
  }
}

// Handle export
main()
  .then(() => {
    console.log("\n🎉 Contract export completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Export script failed:", error);
    process.exit(1);
  });
