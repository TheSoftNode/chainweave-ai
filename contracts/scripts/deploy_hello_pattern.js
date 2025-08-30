const { ethers, network } = require("hardhat");
const { getAddress } = require("@zetachain/toolkit/utils");

/**
 * Deploy ChainWeave following hello project pattern
 * Supports both testnet (free) and mainnet deployment
 */
async function main() {
  console.log("\n🚀 ChainWeave AI Deployment (Hello Project Pattern)");
  console.log("===================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.error("\n❌ Insufficient balance for deployment!");
    console.log("\n💡 Get testnet tokens:");
    console.log("ZetaChain Testnet: https://labs.zetachain.com/get-zeta");
    console.log("Athens Testnet: https://labs.zetachain.com/get-zeta");
    process.exit(1);
  }

    console.log("Network:", network.name);
    const networkInfo = await ethers.provider.getNetwork();
    console.log("Chain ID:", networkInfo.chainId);  // Get Gateway address using ZetaChain toolkit
  let gatewayAddress;
  try {
    gatewayAddress = getAddress("gateway", network.name);
    console.log("Gateway address from toolkit:", gatewayAddress);
  } catch (error) {
    console.log("Using fallback gateway address for", network.name);
    // Fallback addresses based on hello project
    const fallbackGateways = {
      "zetachain_testnet": "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
      "zetachain_athens": "0x6c533f7fe93fae114d0954697069df33c9b74fd7",
      "zetachain_mainnet": "0x5FF8c8e8d8A49b62f9Ec6799dC87C6e56D68E2A9" // Mainnet gateway
    };
    gatewayAddress = fallbackGateways[network.name] || "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  }

  try {
    console.log("\n📄 Deploying ChainWeave Universal Contract...");
    
    // Deploy using same pattern as hello project
    const ChainWeave = await ethers.getContractFactory("ChainWeave");
    const chainWeave = await ChainWeave.deploy(gatewayAddress, deployer.address);
    
    console.log("⏳ Waiting for deployment transaction...");
    await chainWeave.deployed();
    
    const contractAddress = chainWeave.address;
    const deploymentTx = chainWeave.deployTransaction;
    
    console.log("\n✅ Deployment Successful!");
    console.log("========================");
    
    // Output in hello project format for easy integration
    const deploymentResult = {
      contractAddress: contractAddress,
      deployer: deployer.address,
      network: network.name,
      transactionHash: deploymentTx?.hash,
      gateway: gatewayAddress,
      chainId: networkInfo.chainId.toString()
    };
    
    console.log(JSON.stringify(deploymentResult, null, 2));
    
    // Verify contract is working
    console.log("\n🔍 Verifying deployment...");
    const owner = await chainWeave.owner();
    const gateway = await chainWeave.gateway();
    
    console.log("Contract Owner:", owner);
    console.log("Gateway Address:", gateway);
    console.log("Deployment verified ✅");
    
    // Save for next steps
    console.log("\n📝 Next Steps:");
    console.log("==============");
    
    console.log("🧪 TESTNET DEPLOYMENT COMPLETE");
    console.log("1. Test the contract functionality");
    console.log("2. Deploy CrossChainMinter contracts on external testnets");
    console.log("3. Verify cross-chain functionality");
    console.log("4. Perfect for hackathon demonstration!");
    
    if (network.name.includes("mainnet")) {
      console.warn("\n⚠️  WARNING: This is a mainnet deployment!");
      console.warn("   Consider using testnet for development and hackathons");
    }
    
    console.log("\n💾 Environment Variables for .env:");
    console.log(`CHAINWEAVE_ADDRESS=${contractAddress}`);
    console.log(`DEPLOYED_NETWORK=${network.name}`);
    console.log(`GATEWAY_ADDRESS=${gatewayAddress}`);
    
    return contractAddress;
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Insufficient funds for deployment:");
      console.log("- Get testnet tokens: https://labs.zetachain.com/get-zeta");
      console.log("- For mainnet: You need actual ZETA tokens");
    }
    
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 ChainWeave deployment completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Deployment script failed:", error);
      process.exit(1);
    });
}

module.exports = main;
