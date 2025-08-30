const { ethers, network } = require("hardhat");
const deployChainWeave = require("./deploy_ChainWeave");
const deployCrossChainMinter = require("./deploy_CrossChainMinter");

/**
 * Complete deployment script for ChainWeave AI ecosystem
 * 1. Deploys ChainWeave on ZetaChain
 * 2. Deploys CrossChainMinter on target chains
 * 3. Configures cross-chain connections
 */
async function main() {
  console.log("\n🌟 Starting ChainWeave AI Full Deployment");
  console.log("==========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer account:", deployer.address);
  console.log("Current network:", network.name);

  // Deployment steps based on network
  if (network.name === "zetachain_testnet" || network.name === "zetachain") {
    console.log("\n🔗 Deploying on ZetaChain - Step 1: ChainWeave Universal Contract");
    
    // Deploy ChainWeave on ZetaChain
    const chainWeaveAddress = await deployChainWeave();
    
    console.log("\n📋 ZetaChain Deployment Complete!");
    console.log("===============================");
    console.log("ChainWeave Address:", chainWeaveAddress);
    console.log("\n📝 Next Steps:");
    console.log("1. Set CHAINWEAVE_ADDRESS environment variable:");
    console.log(`   export CHAINWEAVE_ADDRESS=${chainWeaveAddress}`);
    console.log("2. Deploy CrossChainMinter contracts on target chains:");
    console.log("   - Ethereum Sepolia: npx hardhat run scripts/deploy_CrossChainMinter.js --network eth_sepolia");
    console.log("   - Base Sepolia: npx hardhat run scripts/deploy_CrossChainMinter.js --network base_sepolia");
    console.log("   - BSC Testnet: npx hardhat run scripts/deploy_CrossChainMinter.js --network bsc_testnet");
    console.log("   - Polygon Amoy: npx hardhat run scripts/deploy_CrossChainMinter.js --network polygon_amoy");
    console.log("3. Configure chain minter addresses on ChainWeave contract");
    console.log("4. Configure frontend with contract addresses and ABIs");

  } else {
    console.log("\n🌉 Deploying on External Chain - Step 2: CrossChainMinter");
    
    // Check if ChainWeave address is set
    const chainWeaveAddress = process.env.CHAINWEAVE_ADDRESS;
    if (!chainWeaveAddress || chainWeaveAddress === "0x0000000000000000000000000000000000000000") {
      console.error("\n❌ Error: CHAINWEAVE_ADDRESS environment variable not set!");
      console.log("Please deploy ChainWeave on ZetaChain first and set the address:");
      console.log("export CHAINWEAVE_ADDRESS=<chainweave_contract_address>");
      process.exit(1);
    }

    // Deploy CrossChainMinter on external chain
    const minterAddress = await deployCrossChainMinter();
    
    console.log("\n📋 External Chain Deployment Complete!");
    console.log("====================================");
    console.log("Network:", network.name);
    console.log("CrossChainMinter Address:", minterAddress);
    console.log("ChainWeave Address:", chainWeaveAddress);
    
    // Get chain ID for configuration
    const networkInfo = await ethers.provider.getNetwork();
    const chainId = Number(networkInfo.chainId);
    
    console.log("\n📝 Configuration Required:");
    console.log("========================");
    console.log("Run the following on ZetaChain to link this minter:");
    console.log(`chainWeave.setChainMinter(${chainId}, "${minterAddress}")`);
    console.log("\nOr use this Hardhat task:");
    console.log(`npx hardhat run scripts/configure_minter.js --network zetachain_testnet`);
    console.log(`  --chain-id ${chainId} --minter-address ${minterAddress}`);
  }

  console.log("\n🎉 Deployment script completed successfully!");
}

// Handle deployment with proper error handling
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n💥 Full deployment failed:", error);
      console.error("Stack trace:", error.stack);
      process.exit(1);
    });
}

module.exports = main;
