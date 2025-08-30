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
    const chainWeave = await ChainWeave.deploy(mockGateway.address, user1.address); // mockGateway as gateway, user1 as backend service

    // Configure mockGateway to know about ChainWeave for callbacks
    await mockGateway.setChainWeaveContract(chainWeave.address);

    // Deploy CrossChainMinter contracts for different chains
    const CrossChainMinter = await ethers.getContractFactory("CrossChainMinter");
    
    const ethMinter = await CrossChainMinter.deploy(
      mockGateway.address,
      chainWeave.address,
      "ChainWeave AI - Ethereum",
      "CWAI-ETH"
    );

    const baseMinter = await CrossChainMinter.deploy(
      mockGateway.address,
      chainWeave.address,
      "ChainWeave AI - Base",
      "CWAI-BASE"
    );

    // Configure chain minters in ChainWeave
    await chainWeave.addSupportedChain(11155111, ethMinter.address); // Ethereum Sepolia
    await chainWeave.addSupportedChain(84532, baseMinter.address);   // Base Sepolia

    // Set backend service for AI completion
    await chainWeave.setBackendService(user1.address);

    // Configure minter contracts to allow ChainWeave calls
    await ethMinter.setChainWeaveContract(chainWeave.address);
    await baseMinter.setChainWeaveContract(chainWeave.address);

    return { 
      chainWeave, 
      ethMinter, 
      baseMinter,
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
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompt = "A magnificent AI-generated artwork of space exploration";
      const destinationChainId = 11155111; // Ethereum Sepolia
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01"); // 0.01 ETH fee

      // Step 1: User requests NFT mint on ZetaChain
      console.log("Step 1: Requesting NFT mint...");
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient,
        { value: mintFee }
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

      // Step 2: Check request status (should be Pending initially)
      console.log("Step 2: Checking request status...");
      let request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(0); // Pending = 0
      expect(request.sender).to.equal(user1.address);

      // Step 3: Simulate AI generation completion
      console.log("Step 3: Simulating AI generation completion...");
      console.log("RequestId:", requestId);
      console.log("Request sender in storage:", request.sender);
      console.log("Request status:", request.status);
      const tokenURI = "https://api.chainweave.ai/metadata/test-" + requestId.substring(0, 8);
      await chainWeave.connect(user1).completeAIGeneration(requestId, tokenURI);

      // Verify status updated to Processing (since _initiateCrossChainMint is called)
      request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(1); // Processing = 1
      expect(request.tokenURI).to.equal(tokenURI);

      console.log("Step 4: Cross-chain minting initiated successfully!");
      console.log("Final request status:", request.status);
      console.log("Request processed:", request.processed);
    });
  });

  describe("Error Handling and Resilience", function () {
    it("Should handle minting failures gracefully", async function () {
      const { 
        chainWeave, 
        mockGateway,
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompt = "Test prompt for failure case";
      const destinationChainId = 11155111;
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01");

      // Request mint
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient,
        { value: mintFee }
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

      // Complete AI generation first
      const tokenURI = "https://api.chainweave.ai/metadata/failure-test";
      await chainWeave.connect(user1).completeAIGeneration(requestId, tokenURI);

      // Simulate failure callback using mockGateway
      const revertMessage = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bool", "uint256", "string"],
        [requestId, false, 0, "Mint failed on destination chain"]
      );

      const mockContext = {
        sender: ethers.utils.arrayify("0x1234"),
        senderEVM: user1.address,
        chainID: 11155111
      };

      await mockGateway.simulateCallback(
        mockContext,
        ethers.constants.AddressZero,
        0,
        revertMessage
      );

      // Check status updated to failed
      const request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(4); // Failed = 4
    });

    it("Should handle invalid recipient addresses", async function () {
      const { chainWeave, user1 } = await loadFixture(deployIntegrationFixture);

      const prompt = "Test prompt";
      const destinationChainId = 11155111;
      const invalidRecipient = "0x"; // Invalid recipient (empty)
      const mintFee = ethers.utils.parseEther("0.01");

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          destinationChainId,
          invalidRecipient,
          { value: mintFee }
        )
      ).to.be.revertedWith("Empty recipient");
    });

    it("Should prevent duplicate minting attempts", async function () {
      const { 
        chainWeave,
        ethMinter,
        mockGateway,
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const prompt = "Test prompt for duplicate check";
      const destinationChainId = 11155111;
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01");

      // Request mint
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient,
        { value: mintFee }
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
      const tokenURI = "https://api.chainweave.ai/metadata/duplicate-test";

      // Complete AI generation
      await chainWeave.connect(user1).completeAIGeneration(requestId, tokenURI);

      // Simulate successful mint callback  
      const successMessage = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bool", "uint256", "string"],
        [requestId, true, 1, ""] // success, tokenId=1, no error
      );

      const mockContext = {
        sender: ethers.utils.arrayify("0x1234"),
        senderEVM: user1.address,
        chainID: destinationChainId
      };

      await mockGateway.simulateCallback(
        mockContext,
        ethers.constants.AddressZero,
        0,
        successMessage
      );

      // Verify first mint completed
      const request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(3); // Completed

      // Try to process the same request again - should fail
      await expect(
        mockGateway.simulateCallback(
          mockContext,
          ethers.constants.AddressZero,
          0,
          successMessage
        )
      ).to.be.revertedWith("Callback failed");
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

      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("access-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/access";

      // Non-gateway users should not be able to call gateway functions
      const mockContext = {
        sender: ethers.utils.arrayify("0x1234"),
        senderEVM: user1.address,
        chainID: 1
      };
      
      const callbackMessage = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bool", "uint256", "string"],
        [requestId, true, 1, ""]
      );

      await expect(
        chainWeave.connect(user1).onCall(
          mockContext,
          ethers.constants.AddressZero,
          0,
          callbackMessage
        )
      ).to.be.revertedWith("Only gateway");

      await expect(
        ethMinter.connect(user2).mintFromChainWeave(
          requestId,
          user1.address,
          tokenURI
        )
      ).to.be.revertedWith("Only ChainWeave or internal");

      // Non-owners should not be able to configure contracts
      await expect(
        chainWeave.connect(user1).addSupportedChain(999999, user1.address)
      ).to.be.revertedWithCustomError(chainWeave, "OwnableUnauthorizedAccount")
      .withArgs(user1.address);

      await expect(
        ethMinter.connect(user1).setDefaultRoyalty(500)
      ).to.be.revertedWithCustomError(ethMinter, "OwnableUnauthorizedAccount")
      .withArgs(user1.address);
    });
  });

  describe("Gas Optimization and Performance", function () {
    it("Should handle batch operations efficiently", async function () {
      const { 
        chainWeave, 
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const batchSize = 3; // Reduced for testing
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01");

      // Create multiple requests
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          chainWeave.connect(user1).requestNFTMint(
            `Batch prompt ${i}`,
            11155111, // Ethereum Sepolia
            recipient,
            { value: mintFee }
          )
        );
      }

      const results = await Promise.all(promises);
      
      // Verify all requests were created
      for (const result of results) {
        await result.wait();
      }

      const result = await chainWeave.getUserRequestsPaginated(user1.address, 0, 10);
      expect(result.requestIds.length).to.equal(batchSize);
    });

    it("Should provide accurate gas estimates", async function () {
      const { chainWeave, user1 } = await loadFixture(deployIntegrationFixture);

      const prompt = "Gas estimation test";
      const destinationChainId = 11155111;
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01");

      // Estimate gas for mint request
      const gasEstimate = await chainWeave.connect(user1).estimateGas.requestNFTMint(
        prompt,
        destinationChainId,
        recipient,
        { value: mintFee }
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
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const initialSupply = await ethMinter.totalSupply();
      const initialBalance = await ethMinter.balanceOf(user1.address);

      // Use proper flow through ChainWeave
      const prompt = "State consistency test";
      const destinationChainId = 11155111;
      const recipient = ethers.utils.solidityPack(["address"], [user1.address]);
      const mintFee = ethers.utils.parseEther("0.01");

      // Request mint
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        destinationChainId,
        recipient,
        { value: mintFee }
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
      const tokenURI = "https://api.chainweave.ai/metadata/consistency";

      // Complete AI generation
      await chainWeave.connect(user1).completeAIGeneration(requestId, tokenURI);

      // For state consistency testing, manually mint to verify the state
      // Temporarily allow owner to mint for testing
      await ethMinter.setChainWeaveContract(owner.address);
      await ethMinter.connect(owner).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );
      // Reset authorization
      await ethMinter.setChainWeaveContract(chainWeave.address);

      // Don't simulate callback since we manually minted

      // Verify state consistency
      expect(await ethMinter.totalSupply()).to.equal(initialSupply + 1n);
      expect(await ethMinter.balanceOf(user1.address)).to.equal(initialBalance + 1n);
      
      const tokenId = await ethMinter.requestToToken(requestId);
      expect(await ethMinter.tokenToRequest(tokenId)).to.equal(requestId);
      expect(await ethMinter.ownerOf(tokenId)).to.equal(user1.address);
      expect(await ethMinter.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });
});
