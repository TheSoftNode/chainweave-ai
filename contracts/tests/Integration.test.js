const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ChainWeave Integration Tests", function () {
  // Mock Gateway for testing cross-chain interactions
  let MockGateway;

  before(async function () {
    // Deploy mock gateway contract for testing
    MockGateway = await ethers.getContractFactory("MockGateway");
  });

  // Fixture for deploying the complete system
  async function deployIntegrationFixture() {
    const [owner, user1, user2, operator] = await ethers.getSigners();

    // Deploy mock gateway
    const mockGateway = await MockGateway.deploy();

    // Deploy ChainWeave contract
    const ChainWeave = await ethers.getContractFactory("ChainWeave");
    const chainWeave = await ChainWeave.deploy(await mockGateway.getAddress());

    // Deploy CrossChainMinter contracts for different chains
    const CrossChainMinter = await ethers.getContractFactory("CrossChainMinter");
    
    const ethMinter = await CrossChainMinter.deploy(
      await mockGateway.getAddress(),
      await chainWeave.getAddress(),
      "ChainWeave AI - Ethereum",
      "CWAI-ETH"
    );

    const baseMinter = await CrossChainMinter.deploy(
      await mockGateway.getAddress(),
      await chainWeave.getAddress(),
      "ChainWeave AI - Base",
      "CWAI-BASE"
    );

    const bscMinter = await CrossChainMinter.deploy(
      await mockGateway.getAddress(),
      await chainWeave.getAddress(),
      "ChainWeave AI - BSC",
      "CWAI-BSC"
    );

    // Configure chain minters in ChainWeave
    await chainWeave.setChainMinter(11155111, await ethMinter.getAddress()); // Ethereum Sepolia
    await chainWeave.setChainMinter(84532, await baseMinter.getAddress());   // Base Sepolia
    await chainWeave.setChainMinter(97, await bscMinter.getAddress());       // BSC Testnet

    return { 
      chainWeave, 
      ethMinter, 
      baseMinter, 
      bscMinter,
      mockGateway,
      owner, 
      user1, 
      user2, 
      operator 
    };
  }

  describe("End-to-End Cross-Chain Minting", function () {
    it("Should complete full cross-chain NFT minting flow", async function () {
      const { 
        chainWeave, 
        ethMinter, 
        mockGateway,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompt = "A magnificent AI-generated artwork of space exploration";
      const destinationChainId = 11155111; // Ethereum Sepolia
      const recipient = ethers.solidityPacked(["address"], [user1.address]);

      // Step 1: User requests NFT mint on ZetaChain
      console.log("Step 1: Requesting NFT mint...");
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const requestId = chainWeave.interface.parseLog(event).args.requestId;

      // Step 2: Check request status (should be Processing)
      console.log("Step 2: Checking request status...");
      let status = await chainWeave.getMintStatus(requestId);
      expect(status.status).to.equal("Processing");
      expect(status.tokenURI).to.not.equal("");

      // Step 3: Simulate cross-chain minting on destination chain
      console.log("Step 3: Simulating cross-chain mint...");
      const decodedRecipient = ethers.getAddress(ethers.dataSlice(recipient, 12));
      
      const mintTx = await ethMinter.connect(mockGateway).mintNFT(
        requestId,
        decodedRecipient,
        status.tokenURI,
        prompt
      );

      await mintTx.wait();

      // Step 4: Verify NFT was minted on destination chain
      console.log("Step 4: Verifying NFT mint...");
      expect(await ethMinter.ownerOf(1)).to.equal(user1.address);
      expect(await ethMinter.tokenURI(1)).to.equal(status.tokenURI);
      expect(await ethMinter.getTokenPrompt(1)).to.equal(prompt);

      // Step 5: Simulate callback to ZetaChain
      console.log("Step 5: Simulating success callback...");
      await chainWeave.connect(mockGateway).onMintSuccess(requestId, 1);

      // Step 6: Verify final status
      console.log("Step 6: Verifying final status...");
      status = await chainWeave.getMintStatus(requestId);
      expect(status.status).to.equal("Completed");
      expect(status.tokenId).to.equal(1);

      // Step 7: Check user NFT history
      console.log("Step 7: Checking user history...");
      const history = await chainWeave.getUserNFTHistory(user1.address);
      expect(history.requestIds.length).to.equal(1);
      expect(history.requestIds[0]).to.equal(requestId);
      expect(history.chainIds[0]).to.equal(destinationChainId);
      expect(history.tokenIds[0]).to.equal(1);

      console.log("✅ End-to-end flow completed successfully!");
    });

    it("Should handle multiple chains simultaneously", async function () {
      const { 
        chainWeave, 
        ethMinter, 
        baseMinter, 
        bscMinter,
        mockGateway,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompts = [
        "Ethereum: Digital ocean waves",
        "Base: Mountain landscapes", 
        "BSC: Abstract geometric patterns"
      ];

      const chains = [
        { id: 11155111, minter: ethMinter, name: "Ethereum" },
        { id: 84532, minter: baseMinter, name: "Base" },
        { id: 97, minter: bscMinter, name: "BSC" }
      ];

      const requestIds = [];

      // Request mints on all chains
      for (let i = 0; i < chains.length; i++) {
        const recipient = ethers.solidityPacked(["address"], [user1.address]);
        
        const tx = await chainWeave.connect(user1).requestNFTMint(
          prompts[i],
          chains[i].id,
          recipient
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
          } catch {
            return false;
          }
        });

        requestIds.push(chainWeave.interface.parseLog(event).args.requestId);
      }

      // Simulate minting on all chains
      for (let i = 0; i < chains.length; i++) {
        const status = await chainWeave.getMintStatus(requestIds[i]);
        
        await chains[i].minter.connect(mockGateway).mintNFT(
          requestIds[i],
          user1.address,
          status.tokenURI,
          prompts[i]
        );

        await chainWeave.connect(mockGateway).onMintSuccess(requestIds[i], 1);
      }

      // Verify all mints completed
      for (let i = 0; i < chains.length; i++) {
        const status = await chainWeave.getMintStatus(requestIds[i]);
        expect(status.status).to.equal("Completed");
        
        expect(await chains[i].minter.ownerOf(1)).to.equal(user1.address);
        expect(await chains[i].minter.getTokenPrompt(1)).to.equal(prompts[i]);
      }

      // Check user history shows all chains
      const history = await chainWeave.getUserNFTHistory(user1.address);
      expect(history.requestIds.length).to.equal(3);
      expect(new Set(history.chainIds.map(id => Number(id)))).to.deep.equal(
        new Set(chains.map(c => c.id))
      );
    });
  });

  describe("Error Handling and Resilience", function () {
    it("Should handle minting failures gracefully", async function () {
      const { 
        chainWeave, 
        ethMinter,
        mockGateway, 
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompt = "Test prompt for failure case";
      const destinationChainId = 11155111;
      const recipient = ethers.solidityPacked(["address"], [user1.address]);

      // Request mint
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
        } catch {
          return false;
        }
      });

      const requestId = chainWeave.interface.parseLog(event).args.requestId;

      // Simulate revert scenario
      const revertMessage = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32"],
        [requestId]
      );

      const revertContext = {
        sender: ethers.ZeroAddress,
        asset: ethers.ZeroAddress,
        amount: 0,
        revertMessage: revertMessage
      };

      await chainWeave.connect(mockGateway).onRevert(revertContext);

      // Check status updated to reverted
      const status = await chainWeave.getMintStatus(requestId);
      expect(status.status).to.equal("Reverted");
    });

    it("Should prevent duplicate minting attempts", async function () {
      const { 
        ethMinter,
        mockGateway,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const requestId = ethers.keccak256(ethers.toUtf8Bytes("duplicate-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/duplicate";
      const prompt = "Duplicate test prompt";

      // First mint should succeed
      await ethMinter.connect(mockGateway).mintNFT(
        requestId,
        user1.address,
        tokenURI,
        prompt
      );

      // Second mint with same request ID should fail
      await expect(
        ethMinter.connect(mockGateway).mintNFT(
          requestId,
          user1.address,
          tokenURI,
          prompt
        )
      ).to.be.revertedWithCustomError(ethMinter, "TokenAlreadyMinted");
    });

    it("Should handle invalid recipient addresses", async function () {
      const { chainWeave, user1 } = await loadFixture(deployIntegrationFixture);

      const prompt = "Test prompt";
      const destinationChainId = 11155111;
      const invalidRecipient = "0x"; // Invalid recipient

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          destinationChainId,
          invalidRecipient
        )
      ).to.not.be.reverted; // Should allow empty recipient for flexibility
    });
  });

  describe("Access Control Integration", function () {
    it("Should enforce proper access controls across contracts", async function () {
      const { 
        chainWeave, 
        ethMinter,
        user1,
        user2 
      } = await loadFixture(deployIntegrationFixture);

      const requestId = ethers.keccak256(ethers.toUtf8Bytes("access-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/access";
      const prompt = "Access control test";

      // Non-gateway users should not be able to call gateway functions
      await expect(
        chainWeave.connect(user1).onMintSuccess(requestId, 1)
      ).to.be.revertedWithCustomError(chainWeave, "Unauthorized");

      await expect(
        ethMinter.connect(user2).mintNFT(
          requestId,
          user1.address,
          tokenURI,
          prompt
        )
      ).to.be.revertedWithCustomError(ethMinter, "Unauthorized");

      // Non-owners should not be able to configure contracts
      await expect(
        chainWeave.connect(user1).setChainMinter(999999, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ethMinter.connect(user1).setBaseURI("https://malicious.com/")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Gas Optimization and Performance", function () {
    it("Should handle batch operations efficiently", async function () {
      const { 
        chainWeave, 
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const batchSize = 5;
      const recipient = ethers.solidityPacked(["address"], [user1.address]);

      // Create multiple requests
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          chainWeave.connect(user1).requestNFTMint(
            `Batch prompt ${i}`,
            11155111, // Ethereum Sepolia
            recipient
          )
        );
      }

      const results = await Promise.all(promises);
      
      // Verify all requests were created
      for (const result of results) {
        await result.wait();
      }

      const history = await chainWeave.getUserNFTHistory(user1.address);
      expect(history.requestIds.length).to.equal(batchSize);
    });

    it("Should provide accurate gas estimates", async function () {
      const { chainWeave, user1 } = await loadFixture(deployIntegrationFixture);

      const prompt = "Gas estimation test";
      const destinationChainId = 11155111;
      const recipient = ethers.solidityPacked(["address"], [user1.address]);

      // Estimate gas for mint request
      const gasEstimate = await chainWeave.connect(user1).requestNFTMint.estimateGas(
        prompt,
        destinationChainId,
        recipient
      );

      expect(gasEstimate).to.be.gt(0);
      expect(gasEstimate).to.be.lt(1000000); // Should be reasonable
    });
  });

  describe("State Consistency", function () {
    it("Should maintain consistent state across all operations", async function () {
      const { 
        chainWeave, 
        ethMinter,
        mockGateway,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const initialSupply = await ethMinter.totalSupply();
      const initialBalance = await ethMinter.balanceOf(user1.address);

      // Mint an NFT
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("consistency-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/consistency";
      const prompt = "State consistency test";

      await ethMinter.connect(mockGateway).mintNFT(
        requestId,
        user1.address,
        tokenURI,
        prompt
      );

      // Verify state consistency
      expect(await ethMinter.totalSupply()).to.equal(initialSupply + 1n);
      expect(await ethMinter.balanceOf(user1.address)).to.equal(initialBalance + 1n);
      
      const tokenId = await ethMinter.requestToTokenId(requestId);
      expect(await ethMinter.tokenIdToRequest(tokenId)).to.equal(requestId);
      expect(await ethMinter.ownerOf(tokenId)).to.equal(user1.address);
      expect(await ethMinter.tokenURI(tokenId)).to.equal(tokenURI);
      expect(await ethMinter.getTokenPrompt(tokenId)).to.equal(prompt);
    });
  });
});


// Mock System Contract for ZetaChain testing
contract("MockSystemContract", function() {
  function MockSystemContract() {}
  
  MockSystemContract.prototype.crossChainCall = function(chainId, target, data, gasLimit) {
    // Mock successful cross-chain call
    return true;
  };

  MockSystemContract.prototype.onCrossChainCall = function(context, target, data) {
    // Mock cross-chain call response
    return "0x";
  };

  return MockSystemContract;
});

// Mock ZetaConnector for testing
contract("MockZetaConnector", function() {
  function MockZetaConnector() {}
  
  MockZetaConnector.prototype.send = function(sendInput) {
    return {
      zetaTxHash: "0x1234567890abcdef",
      success: true
    };
  };

  return MockZetaConnector;
});
