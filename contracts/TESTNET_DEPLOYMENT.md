# 🚀 ChainWeave AI - Testnet Deployment Guide

**Perfect for Hackathon Demonstration - NO MAINNET COSTS!**

## 🎯 Hackathon Strategy

Deploy ChainWeave AI entirely on **testnets** to demonstrate full cross-chain AI NFT functionality:

✅ **$0 deployment cost** - All testnet tokens are FREE  
✅ **Full functionality** - Real cross-chain transactions  
✅ **Live demonstration** - Working dApp for judges  
✅ **Production ready** - Enterprise-grade contracts

## 🆓 Free Testnet Tokens

### 1. ZetaChain Athens Testnet

```bash
# Get FREE ZETA tokens
https://labs.zetachain.com/get-zeta
```

### 2. External Testnet Tokens

- **Ethereum Sepolia**: https://sepoliafaucet.com/
- **Base Sepolia**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **BSC Testnet**: https://testnet.bnbchain.org/faucet-smart
- **Polygon Amoy**: https://faucet.polygon.technology/

## 🔧 Quick Setup

### 1. Install & Configure

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your deployment wallet private key
```

### 2. Get Testnet Tokens

Visit the faucets above and get tokens for your deployment wallet on all networks.

### 3. Test Everything Works

```bash
npm test
npm run compile
```

## 🚀 Deployment Process

### Step 1: Deploy ChainWeave on ZetaChain Athens

```bash
npm run deploy:testnet
```

Copy the contract address and set it:

```bash
export CHAINWEAVE_ADDRESS=<contract_address_from_output>
```

### Step 2: Deploy CrossChainMinters on External Testnets

```bash
# Deploy on all supported testnets
npm run deploy:minter:eth      # Ethereum Sepolia
npm run deploy:minter:base     # Base Sepolia
npm run deploy:minter:bsc      # BSC Testnet
npm run deploy:minter:polygon  # Polygon Amoy
```

Save each minter address:

```bash
export ETH_MINTER_ADDRESS=<ethereum_minter>
export BASE_MINTER_ADDRESS=<base_minter>
export BSC_MINTER_ADDRESS=<bsc_minter>
export POLYGON_MINTER_ADDRESS=<polygon_minter>
```

### Step 3: Configure Cross-Chain Connections

```bash
npm run configure:testnet
```

## 🎉 You're Done!

Your ChainWeave AI is now deployed and fully functional across:

- **ZetaChain Athens** (main contract)
- **Ethereum Sepolia** (NFT minting)
- **Base Sepolia** (NFT minting)
- **BSC Testnet** (NFT minting)
- **Polygon Amoy** (NFT minting)

## 🔍 Verification

Check your deployments on block explorers:

- ZetaChain: https://zetachain-athens.blockscout.com/
- Ethereum: https://sepolia.etherscan.io/
- Base: https://sepolia-explorer.base.org/
- BSC: https://testnet.bscscan.com/
- Polygon: https://amoy.polygonscan.com/

## 📱 Frontend Integration

Update your frontend with the deployed contract addresses and start minting AI NFTs across all chains!

## 🏆 Hackathon Benefits

✅ **Zero cost** demonstration  
✅ **Full cross-chain** functionality  
✅ **Real transactions** on public testnets  
✅ **Verifiable contracts** for judges  
✅ **Live demo** capability  
✅ **Production ready** codebase

Perfect for hackathon submission without spending real money!
