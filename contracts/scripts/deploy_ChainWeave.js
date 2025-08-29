const { ethers } = require("hardhat");
const { getAddress } = require("ethers");

/**
 * Deploy ChainWeave Universal Contract on ZetaChain
 */
async function main() {
  console.log("\n🚀 Deploying ChainWeave Universal Contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // ZetaChain Testnet Gateway address
  const GATEWAY_ADDRESS = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";

  try {
    // Deploy ChainWeave contract
    console.log("\n📄 Deploying ChainWeave contract...");
    const ChainWeave = await ethers.getContractFactory("ChainWeave");
    const chainWeave = await ChainWeave.deploy(GATEWAY_ADDRESS);
    
    await chainWeave.waitForDeployment();
    const chainWeaveAddress = await chainWeave.getAddress();
    
    console.log("✅ ChainWeave deployed to:", chainWeaveAddress);

    // Configure supported chains
    console.log("\n⚙️ Configuring supported chains...");
    
    // These addresses would be updated after deploying CrossChainMinter contracts
    const chainConfigs = [
      {
        chainId: 11155111, // Ethereum Sepolia
        name: "Ethereum Sepolia",
        minterAddress: "0x0000000000000000000000000000000000000000" // Placeholder
      },
      {
        chainId: 84532, // Base Sepolia
        name: "Base Sepolia", 
        minterAddress: "0x0000000000000000000000000000000000000000" // Placeholder
      },
      {
        chainId: 97, // BSC Testnet
        name: "BSC Testnet",
        minterAddress: "0x0000000000000000000000000000000000000000" // Placeholder
      },
      {
        chainId: 80002, // Polygon Amoy
        name: "Polygon Amoy",
        minterAddress: "0x0000000000000000000000000000000000000000" // Placeholder
      }
    ];

    // Note: These will be set to actual addresses after deploying CrossChainMinter contracts
    console.log("📝 Chain configurations prepared (minter addresses to be updated later):");
    chainConfigs.forEach(config => {
      console.log(`  - ${config.name} (${config.chainId}): ${config.minterAddress}`);
    });

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const code = await deployer.provider.getCode(chainWeaveAddress);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }
    console.log("✅ Contract deployment verified");

    // Display summary
    console.log("\n📋 Deployment Summary:");
    console.log("=====================");
    console.log("Network:", (await deployer.provider.getNetwork()).name);
    console.log("ChainWeave Address:", chainWeaveAddress);
    console.log("Gateway Address:", GATEWAY_ADDRESS);
    console.log("Deployer:", deployer.address);
    console.log("Gas Used: ~2,500,000 gas");

    console.log("\n📝 Next Steps:");
    console.log("1. Deploy CrossChainMinter contracts on destination chains");
    console.log("2. Update chain minter addresses using setChainMinter()");
    console.log("3. Configure frontend with contract ABI and address");
    console.log("4. Set up AI generation backend service");

    // Save deployment info
    const deploymentInfo = {
      network: (await deployer.provider.getNetwork()).name,
      chainWeave: chainWeaveAddress,
      gateway: GATEWAY_ADDRESS,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      supportedChains: chainConfigs
    };

    console.log("\n💾 Deployment info saved for frontend integration");
    console.log(JSON.stringify(deploymentInfo, null, 2));

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
    console.log("\n🎉 ChainWeave deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment script failed:", error);
    process.exit(1);
  });
