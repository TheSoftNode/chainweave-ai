# 🚀 Free Testnet Deployment Guide

This guide shows how to deploy ChainWeave AI on ZetaChain testnet for FREE, following the hello project pattern. Perfect for hackathon submissions without mainnet costs!

## 🎯 Strategy Overview

Instead of expensive mainnet deployment, we'll:

1. **Deploy on ZetaChain Athens Testnet** (FREE tokens via faucet)
2. **Deploy CrossChainMinter on external testnets** (FREE testnet tokens)
3. **Demonstrate full functionality** with working cross-chain minting
4. **Provide mainnet deployment scripts** for future production use

## 🆓 Getting FREE Testnet Tokens

### 1. ZetaChain Athens Testnet (FREE ZETA)

**Primary Faucet:**

```bash
# Visit the official faucet
https://labs.zetachain.com/get-zeta
```

**Steps:**

1. Connect your MetaMask wallet
2. Switch to ZetaChain Athens Testnet network
3. Request ZETA tokens (usually 1-5 ZETA per request)
4. Wait for tokens to arrive (usually instant)

**Network Details:**

- Network Name: ZetaChain Athens Testnet
- RPC URL: `https://zetachain-athens-evm.blockpi.network/v1/rpc/public`
- Chain ID: `7001`
- Currency: `ZETA`
- Explorer: `https://zetachain-athens.blockscout.com/`

### 2. External Testnet Tokens

#### **Ethereum Sepolia (FREE ETH)**

```bash
# Multiple faucets available
https://sepoliafaucet.com/
https://faucet.sepolia.dev/
https://faucet.quicknode.com/ethereum/sepolia
```

#### **Base Sepolia (FREE ETH)**

```bash
# Coinbase official faucet
https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

#### **BSC Testnet (FREE BNB)**

```bash
# Binance official faucet
https://testnet.bnbchain.org/faucet-smart
```

#### **Polygon Amoy (FREE MATIC)**

```bash
# Polygon official faucet
https://faucet.polygon.technology/
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/apple/Desktop/Hackathons/zetachain-hacks/chainweave-ai/contracts
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your deployment wallet:

```bash
# Use a dedicated deployment wallet (not your main wallet)
PRIVATE_KEY=your_deployment_wallet_private_key

# Optional: API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key
BSCSCAN_API_KEY=your_bscscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

### 3. Add Networks to MetaMask

**ZetaChain Athens Testnet:**

- Network Name: `ZetaChain Athens Testnet`
- RPC URL: `https://zetachain-athens-evm.blockpi.network/v1/rpc/public`
- Chain ID: `7001`
- Currency: `ZETA`
- Explorer: `https://zetachain-athens.blockscout.com/`

## 🚀 Deployment Process

### Step 1: Deploy on ZetaChain Athens Testnet

```bash
# Compile contracts
npx hardhat compile

# Run tests to ensure everything works
npx hardhat test

# Deploy ChainWeave on ZetaChain Athens Testnet
npx hardhat run scripts/deploy_hello_pattern.js --network zetachain_athens
```

**Expected Output:**

```json
{
  "contractAddress": "0x...",
  "deployer": "0x...",
  "network": "zetachain_athens",
  "transactionHash": "0x...",
  "gateway": "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
  "chainId": "7001"
}
```

### Step 2: Deploy CrossChainMinter on External Testnets

```bash
# Set ChainWeave address from Step 1
export CHAINWEAVE_ADDRESS=<address_from_step_1>

# Deploy on Ethereum Sepolia
npx hardhat run scripts/deploy_CrossChainMinter.js --network eth_sepolia

# Deploy on Base Sepolia
npx hardhat run scripts/deploy_CrossChainMinter.js --network base_sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy_CrossChainMinter.js --network bsc_testnet

# Deploy on Polygon Amoy
npx hardhat run scripts/deploy_CrossChainMinter.js --network polygon_amoy
```

### Step 3: Configure Cross-Chain Connections

```bash
# Set minter addresses from Step 2
export ETH_MINTER_ADDRESS=<ethereum_minter_address>
export BASE_MINTER_ADDRESS=<base_minter_address>
export BSC_MINTER_ADDRESS=<bsc_minter_address>
export POLYGON_MINTER_ADDRESS=<polygon_minter_address>

# Configure ChainWeave with minter addresses
npx hardhat run scripts/configure_minters.js --network zetachain_athens
```

### Step 4: Verify Deployment

```bash
# Test cross-chain functionality
npx hardhat run scripts/test_cross_chain.js --network zetachain_athens
```

## 📊 Cost Breakdown

| Component                  | Testnet Cost       | Mainnet Cost |
| -------------------------- | ------------------ | ------------ |
| ZetaChain Deployment       | **FREE** (faucet)  | ~$50-100     |
| External Chain Deployments | **FREE** (faucets) | ~$200-400    |
| Cross-chain transactions   | **FREE** (testnet) | ~$10-20 each |
| **Total**                  | **$0**             | **$250-520** |

## 🏆 Hackathon Submission Strategy

### For Judges/Evaluation:

1. **Live Demo:** Working testnet deployment with real cross-chain minting
2. **Code Quality:** Enterprise-grade contracts with comprehensive tests
3. **Documentation:** Complete deployment guides and API documentation
4. **Innovation:** AI-generated NFTs across multiple chains via ZetaChain
5. **Mainnet Ready:** Production deployment scripts ready for launch

### Submission Materials:

```bash
# Contract addresses on testnets
ZetaChain Athens: 0x... (ChainWeave)
Ethereum Sepolia: 0x... (CrossChainMinter)
Base Sepolia: 0x... (CrossChainMinter)
BSC Testnet: 0x... (CrossChainMinter)
Polygon Amoy: 0x... (CrossChainMinter)

# Live demo URLs
Frontend: https://chainweave-ai-demo.vercel.app
Block Explorer: https://zetachain-athens.blockscout.com/address/0x...
```

## 🔄 Mainnet Migration Plan

When ready for production:

```bash
# 1. Deploy on ZetaChain Mainnet
npx hardhat run scripts/deploy_hello_pattern.js --network zetachain_mainnet

# 2. Deploy on production chains
npx hardhat run scripts/deploy_CrossChainMinter.js --network eth_mainnet
npx hardhat run scripts/deploy_CrossChainMinter.js --network base_mainnet
npx hardhat run scripts/deploy_CrossChainMinter.js --network bsc_mainnet
npx hardhat run scripts/deploy_CrossChainMinter.js --network polygon_mainnet

# 3. Configure production settings
npx hardhat run scripts/configure_minters.js --network zetachain_mainnet
```

## 🎯 Benefits of This Approach

✅ **Zero deployment costs** for hackathon demonstration  
✅ **Full functionality testing** with real cross-chain transactions  
✅ **Production-ready codebase** that can be deployed to mainnet  
✅ **Comprehensive testing** on actual networks, not just local  
✅ **Verifiable contracts** on public testnets  
✅ **Live demo capability** for judges and users

## 🆘 Troubleshooting

### Common Issues:

1. **"Insufficient funds" error**

   ```bash
   # Solution: Get more testnet tokens from faucets
   # Wait 24h between faucet requests if rate limited
   ```

2. **"Network not found" error**

   ```bash
   # Solution: Check hardhat.config.js includes ZetaChain networks
   # Ensure @zetachain/toolkit is properly installed
   ```

3. **"Gateway address not found"**
   ```bash
   # Solution: Script uses fallback addresses
   # Manually set gateway address if needed
   ```

## 📞 Support

- ZetaChain Discord: https://discord.gg/zetachain
- Faucet Issues: https://labs.zetachain.com/get-zeta
- Documentation: https://docs.zetachain.com/

---

**🎉 You're now ready to deploy ChainWeave AI for FREE and demonstrate full cross-chain AI NFT functionality!**
