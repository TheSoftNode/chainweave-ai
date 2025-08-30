const { ethers, network } = require("hardhat");

/**
 * Configure ChainWeave contract with CrossChainMinter addresses
 * Run this after deploying CrossChainMinter contracts on external chains
 */
async function main() {
  console.log("\n🔧 Configuring ChainWeave with CrossChainMinter addresses");
  console.log("=========================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);
  console.log("Network:", network.name);

  // ChainWeave contract address (should be set from deployment)
  const chainWeaveAddress = process.env.CHAINWEAVE_ADDRESS;
  if (!chainWeaveAddress) {
    console.error("❌ CHAINWEAVE_ADDRESS environment variable not set!");
    console.log("Please set the ChainWeave contract address:");
    console.log("export CHAINWEAVE_ADDRESS=<chainweave_contract_address>");
    process.exit(1);
  }

  console.log("ChainWeave Address:", chainWeaveAddress);

  // Get ChainWeave contract instance
  const ChainWeave = await ethers.getContractFactory("ChainWeave");
  const chainWeave = ChainWeave.attach(chainWeaveAddress);

  // Verify contract ownership
  const owner = await chainWeave.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ Not contract owner! Owner: ${owner}, Deployer: ${deployer.address}`);
    process.exit(1);
  }

  // CrossChainMinter addresses for each supported chain
  // These should be updated with actual deployed addresses
  const minterConfigurations = [
    {
      chainId: 11155111,
      name: "Ethereum Sepolia",
      minterAddress: process.env.ETH_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 84532,
      name: "Base Sepolia",
      minterAddress: process.env.BASE_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 97,
      name: "BSC Testnet",
      minterAddress: process.env.BSC_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: 80002,
      name: "Polygon Amoy",
      minterAddress: process.env.POLYGON_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000"
    }
  ];

  console.log("\n⚙️ Configuring chain minters...");

  let configurationsSet = 0;
  for (const config of minterConfigurations) {
    if (config.minterAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️ Skipping ${config.name} - no minter address set`);
      continue;
    }

    try {
      console.log(`Setting minter for ${config.name} (${config.chainId}): ${config.minterAddress}`);
      
      // Check if already set
      const currentMinter = await chainWeave.chainMinters(config.chainId);
      if (currentMinter.toLowerCase() === config.minterAddress.toLowerCase()) {
        console.log(`✅ ${config.name} minter already configured correctly`);
        configurationsSet++;
        continue;
      }

      // Set the minter address
      const tx = await chainWeave.setChainMinter(config.chainId, config.minterAddress);
      console.log(`📝 Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ ${config.name} minter configured (Gas used: ${receipt.gasUsed})`);
      configurationsSet++;

      // Verify the configuration
      const verifyMinter = await chainWeave.chainMinters(config.chainId);
      if (verifyMinter.toLowerCase() !== config.minterAddress.toLowerCase()) {
        console.error(`❌ Configuration verification failed for ${config.name}`);
      } else {
        console.log(`🔍 Verified: ${config.name} minter correctly set`);
      }

    } catch (error) {
      console.error(`❌ Failed to configure ${config.name}: ${error.message}`);
    }
  }

  // Display current configuration status
  console.log("\n📋 Current ChainWeave Configuration:");
  console.log("===================================");
  
  for (const config of minterConfigurations) {
    try {
      const minter = await chainWeave.chainMinters(config.chainId);
      const isConfigured = minter !== "0x0000000000000000000000000000000000000000";
      console.log(`${config.name} (${config.chainId}): ${isConfigured ? '✅' : '❌'} ${minter}`);
    } catch (error) {
      console.log(`${config.name} (${config.chainId}): ❌ Error reading configuration`);
    }
  }

  // Additional contract information
  console.log("\n📊 Contract Information:");
  console.log("========================");
  try {
    const contractOwner = await chainWeave.owner();
    const gateway = await chainWeave.gateway();
    const backendService = await chainWeave.backendService();
    
    console.log("Owner:", contractOwner);
    console.log("Gateway:", gateway);
    console.log("Backend Service:", backendService);
    
    // Get total number of NFTs minted
    try {
      const totalSupply = await chainWeave.totalSupply();
      console.log("Total NFTs minted:", totalSupply.toString());
    } catch (error) {
      console.log("Total Supply: Not available (function may not exist)");
    }
    
  } catch (error) {
    console.error("Error reading contract information:", error.message);
  }

  console.log(`\n🎉 Configuration complete! ${configurationsSet} chains configured.`);
  
  if (configurationsSet === 0) {
    console.log("\n📝 To configure minters, set environment variables:");
    console.log("export ETH_MINTER_ADDRESS=<ethereum_minter_address>");
    console.log("export BASE_MINTER_ADDRESS=<base_minter_address>");
    console.log("export BSC_MINTER_ADDRESS=<bsc_minter_address>");
    console.log("export POLYGON_MINTER_ADDRESS=<polygon_minter_address>");
    console.log("\nThen run this script again.");
  }
}

// Handle configuration
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ ChainWeave configuration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Configuration failed:", error);
      process.exit(1);
    });
}

module.exports = main;
