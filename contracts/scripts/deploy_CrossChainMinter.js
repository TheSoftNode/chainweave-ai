const { ethers } = require("hardhat");
const { getAddress } = require("ethers");

/**
 * Deploy CrossChainMinter contracts on external chains
 */
async function main() {
  console.log("\n🚀 Deploying CrossChainMinter Contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Get network information
  const network = await deployer.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // Gateway addresses for different chains
  const gatewayAddresses = {
    11155111: "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Ethereum Sepolia
    84532: "0x6c533f7fe93fae114d0954697069df33c9b74fd7",   // Base Sepolia
    97: "0x6c533f7fe93fae114d0954697069df33c9b74fd7",      // BSC Testnet
    80002: "0x6c533f7fe93fae114d0954697069df33c9b74fd7"    // Polygon Amoy
  };

  // Chain-specific collection names
  const collectionConfigs = {
    11155111: {
      name: "ChainWeave AI - Ethereum",
      symbol: "CWAI-ETH",
      description: "AI-generated NFTs on Ethereum via ZetaChain"
    },
    84532: {
      name: "ChainWeave AI - Base",
      symbol: "CWAI-BASE", 
      description: "AI-generated NFTs on Base via ZetaChain"
    },
    97: {
      name: "ChainWeave AI - BSC",
      symbol: "CWAI-BSC",
      description: "AI-generated NFTs on BSC via ZetaChain"
    },
    80002: {
      name: "ChainWeave AI - Polygon",
      symbol: "CWAI-MATIC",
      description: "AI-generated NFTs on Polygon via ZetaChain"
    }
  };

  // Validate chain support
  if (!gatewayAddresses[chainId]) {
    console.error(`❌ Unsupported chain ID: ${chainId}`);
    console.log("Supported chains:", Object.keys(gatewayAddresses));
    process.exit(1);
  }

  const gatewayAddress = gatewayAddresses[chainId];
  const collectionConfig = collectionConfigs[chainId];

  // ChainWeave contract address on ZetaChain (update after ZetaChain deployment)
  const CHAINWEAVE_ADDRESS = process.env.CHAINWEAVE_ADDRESS || "0x0000000000000000000000000000000000000000";

  if (CHAINWEAVE_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.warn("⚠️ CHAINWEAVE_ADDRESS not set. Please deploy ChainWeave on ZetaChain first.");
    console.log("Set CHAINWEAVE_ADDRESS environment variable and run again.");
  }

  try {
    // Deploy CrossChainMinter contract
    console.log(`\n📄 Deploying CrossChainMinter for ${collectionConfig.name}...`);
    const CrossChainMinter = await ethers.getContractFactory("CrossChainMinter");
    const crossChainMinter = await CrossChainMinter.deploy(
      gatewayAddress,
      CHAINWEAVE_ADDRESS,
      collectionConfig.name,
      collectionConfig.symbol
    );

    await crossChainMinter.waitForDeployment();
    const minterAddress = await crossChainMinter.getAddress();
    
    console.log("✅ CrossChainMinter deployed to:", minterAddress);

    // Set initial configuration
    console.log("\n⚙️ Configuring CrossChainMinter...");
    
    // Set base URI (can be updated later)
    const baseURI = "https://api.chainweave.ai/metadata/";
    await crossChainMinter.setBaseURI(baseURI);
    console.log("✅ Base URI set:", baseURI);

    // Set contract URI for OpenSea compatibility
    const contractURI = `https://api.chainweave.ai/contract-metadata/${chainId}`;
    await crossChainMinter.setContractURI(contractURI);
    console.log("✅ Contract URI set:", contractURI);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const code = await deployer.provider.getCode(minterAddress);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }

    // Test contract functions
    const name = await crossChainMinter.name();
    const symbol = await crossChainMinter.symbol();
    const owner = await crossChainMinter.owner();
    
    console.log("✅ Contract deployment verified");
    console.log("  - Name:", name);
    console.log("  - Symbol:", symbol);  
    console.log("  - Owner:", owner);

    // Display summary
    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    console.log("Network:", network.name);
    console.log("Chain ID:", chainId);
    console.log("CrossChainMinter Address:", minterAddress);
    console.log("Gateway Address:", gatewayAddress);
    console.log("ChainWeave Address:", CHAINWEAVE_ADDRESS);
    console.log("Collection Name:", collectionConfig.name);
    console.log("Collection Symbol:", collectionConfig.symbol);
    console.log("Deployer:", deployer.address);

    console.log("\n📝 Next Steps:");
    console.log("1. Update ChainWeave contract with this minter address:");
    console.log(`   chainWeave.setChainMinter(${chainId}, "${minterAddress}")`);
    console.log("2. Configure frontend with contract ABI and address");
    console.log("3. Test cross-chain minting functionality");

    // Save deployment info for integration
    const deploymentInfo = {
      network: network.name,
      chainId: chainId,
      crossChainMinter: minterAddress,
      gateway: gatewayAddress,
      chainWeave: CHAINWEAVE_ADDRESS,
      collection: collectionConfig,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };

    console.log("\n💾 Deployment info for integration:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Generate setChainMinter call data for ChainWeave
    console.log("\n🔧 ChainWeave configuration call:");
    console.log(`setChainMinter(${chainId}, "${minterAddress}")`);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

// Handle deployment
main()
  .then(() => {
    console.log("\n🎉 CrossChainMinter deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment script failed:", error);
    process.exit(1);
  });
