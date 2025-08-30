require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Import ZetaChain toolkit for proper configuration
const { getHardhatConfig } = require("@zetachain/toolkit/utils");

// Get ZetaChain config first
const zetaConfig = getHardhatConfig({ 
  accounts: [process.env.PRIVATE_KEY || ""] 
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Use ZetaChain's hardhat configuration with our customizations
  ...zetaConfig,
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR for gas optimization with complex contracts
    },
  },
  // Override paths to ensure our test directory is used
  paths: {
    ...zetaConfig.paths,
    test: "./tests"
  },
  // The getHardhatConfig already includes all ZetaChain networks
  // Including testnet and mainnet configurations
};
