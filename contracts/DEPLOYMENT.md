# ChainWeave AI - Deployment Guide

This guide covers the complete deployment of ChainWeave AI smart contracts on ZetaChain and connected external chains.

## 🏗️ Architecture Overview

ChainWeave AI consists of two main contract types:

1. **ChainWeave Universal Contract** (deployed on ZetaChain)

   - Central hub for AI NFT generation requests
   - Manages cross-chain minting coordination
   - Handles AI generation backend integration

2. **CrossChainMinter Contracts** (deployed on external chains)
   - ERC721 NFT contracts for each supported chain
   - Receive cross-chain mint calls from ZetaChain
   - Handle royalties and metadata

## 🚀 Quick Start Deployment

### Prerequisites

1. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your private key and API keys
   ```

3. **Compile Contracts**

   ```bash
   npx hardhat compile
   ```

4. **Run Tests**
   ```bash
   npx hardhat test
   ```

### Step 1: Deploy on ZetaChain

Deploy the ChainWeave Universal Contract on ZetaChain testnet:

```bash
# Deploy ChainWeave on ZetaChain
npx hardhat run scripts/deploy_ChainWeave.js --network zetachain_testnet

# Save the deployed address
export CHAINWEAVE_ADDRESS=<deployed_address>
```

### Step 2: Deploy CrossChainMinter on External Chains

Deploy CrossChainMinter contracts on each supported chain:

```bash
# Ethereum Sepolia
npx hardhat run scripts/deploy_CrossChainMinter.js --network eth_sepolia

# Base Sepolia
npx hardhat run scripts/deploy_CrossChainMinter.js --network base_sepolia

# BSC Testnet
npx hardhat run scripts/deploy_CrossChainMinter.js --network bsc_testnet

# Polygon Amoy
npx hardhat run scripts/deploy_CrossChainMinter.js --network polygon_amoy
```

### Step 3: Configure Cross-Chain Connections

Update ChainWeave with CrossChainMinter addresses:

```bash
# Set environment variables for each deployed minter
export ETH_MINTER_ADDRESS=<ethereum_minter_address>
export BASE_MINTER_ADDRESS=<base_minter_address>
export BSC_MINTER_ADDRESS=<bsc_minter_address>
export POLYGON_MINTER_ADDRESS=<polygon_minter_address>

# Configure ChainWeave with minter addresses
npx hardhat run scripts/configure_minters.js --network zetachain_testnet
```

## 🔧 Advanced Deployment

### Using the Full Deployment Script

For automated deployment detection based on network:

```bash
# On ZetaChain
npx hardhat run scripts/deploy_full.js --network zetachain_testnet

# On external chains (with CHAINWEAVE_ADDRESS set)
npx hardhat run scripts/deploy_full.js --network eth_sepolia
npx hardhat run scripts/deploy_full.js --network base_sepolia
```

### Custom Network Configuration

Update `hardhat.config.js` for custom networks:

```javascript
networks: {
  custom_testnet: {
    url: "https://your-rpc-url",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 12345,
  }
}
```

## 🌐 Supported Networks

### ZetaChain

- **Testnet**: `zetachain_testnet`
- **Mainnet**: `zetachain_mainnet`

### External Chains

- **Ethereum Sepolia**: Chain ID 11155111
- **Base Sepolia**: Chain ID 84532
- **BSC Testnet**: Chain ID 97
- **Polygon Amoy**: Chain ID 80002

## 📝 Environment Variables

Required for deployment:

```bash
# Core deployment
PRIVATE_KEY=your_private_key_here
CHAINWEAVE_ADDRESS=deployed_chainweave_address

# CrossChainMinter addresses
ETH_MINTER_ADDRESS=ethereum_minter_address
BASE_MINTER_ADDRESS=base_minter_address
BSC_MINTER_ADDRESS=bsc_minter_address
POLYGON_MINTER_ADDRESS=polygon_minter_address

# API keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Test Specific Contract

```bash
npx hardhat test tests/ChainWeave.test.js
npx hardhat test tests/CrossChainMinter.test.js
npx hardhat test tests/Integration.test.js
```

### Test Cross-Chain Functionality

```bash
# After deployment, test cross-chain minting
npx hardhat run scripts/test_cross_chain.js --network zetachain_testnet
```

## 🔍 Contract Verification

Verify contracts on block explorers:

```bash
# ZetaChain
npx hardhat verify --network zetachain_testnet <address> <constructor_args>

# Ethereum Sepolia
npx hardhat verify --network eth_sepolia <address> <constructor_args>
```

## 📊 Gas Optimization

Contracts are optimized for gas efficiency:

- **ChainWeave**: ~2.5M gas for deployment
- **CrossChainMinter**: ~3.2M gas for deployment
- **Cross-chain mint**: ~150K gas on destination chain

## 🐛 Troubleshooting

### Common Issues

1. **Gateway Address Not Found**

   ```bash
   # Check if network is supported by ZetaChain toolkit
   # Use fallback addresses from .env.example
   ```

2. **Constructor Argument Mismatch**

   ```bash
   # Ensure correct constructor parameters:
   # ChainWeave: (gateway, owner)
   # CrossChainMinter: (gateway, chainWeave, name, symbol, owner)
   ```

3. **Cross-Chain Configuration**
   ```bash
   # Verify minter addresses are set correctly
   npx hardhat run scripts/verify_configuration.js --network zetachain_testnet
   ```

### Debug Mode

Enable detailed logging:

```bash
export DEBUG=true
npx hardhat run scripts/deploy_ChainWeave.js --network zetachain_testnet
```

## 🔐 Security Considerations

1. **Private Key Management**

   - Never commit private keys to version control
   - Use hardware wallets for mainnet deployments
   - Consider multi-sig for contract ownership

2. **Contract Upgradability**

   - Contracts are non-upgradeable by design
   - Use proxy patterns if upgradability is needed
   - Implement proper access controls

3. **Cross-Chain Security**
   - Gateway addresses are hardcoded for security
   - Only authorized minters can mint NFTs
   - All cross-chain calls are validated

## 📚 Additional Resources

- [ZetaChain Documentation](https://docs.zetachain.com)
- [Universal Contracts Guide](https://docs.zetachain.com/developers/universal-contracts)
- [ChainWeave AI Frontend Integration](../frontend/README.md)
- [API Documentation](../resources/frontend_connection.md)

## 🆘 Support

For deployment issues or questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review contract tests for examples
3. Consult ZetaChain documentation
4. Open an issue in the repository

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.
