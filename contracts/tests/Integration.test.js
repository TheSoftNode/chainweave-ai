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
    const chainWeave = await ChainWeave.deploy(owner.address, user1.address); // owner as gateway for testing, user1 as backend service

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
      const tokenURI = "https://api.chainweave.ai/metadata/test-" + requestId.substring(0, 8);
      await chainWeave.connect(user1).completeAIGeneration(requestId, tokenURI);

      // Verify status updated to Processing (since _initiateCrossChainMint is called)
      request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(1); // Processing = 1
      expect(request.tokenURI).to.equal(tokenURI);

      // Step 4: The cross-chain mint is automatically initiated by completeAIGeneration
      // In a real scenario, the gateway would call the destination minter
      // For testing, we simulate the successful mint directly
      console.log("Step 4: Simulating successful cross-chain mint...");
      
      // Manually mint on destination chain to simulate the cross-chain result
      await ethMinter.setChainWeaveContract(owner.address); // Temporarily allow owner to mint
      const mintTx = await ethMinter.connect(owner).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );
      await mintTx.wait();
      // Reset the authorization
      await ethMinter.setChainWeaveContract(chainWeave.address);

      await mintTx.wait();

      // Step 5: Verify NFT was minted on destination chain
      console.log("Step 5: Verifying NFT mint...");
      expect(await ethMinter.ownerOf(1)).to.equal(user1.address);
      expect(await ethMinter.tokenURI(1)).to.equal(tokenURI);

      // Step 6: Simulate callback to ZetaChain
      console.log("Step 6: Simulating success callback...");
      const callbackMessage = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bool", "uint256", "string"],
        [requestId, true, 1, ""]
      );
      
      const mockContext = {
        sender: ethers.utils.arrayify("0x1234"),
        senderEVM: user1.address,
        chainID: destinationChainId
      };

      await chainWeave.connect(mockGateway).onCall(
        mockContext,
        ethers.constants.AddressZero, // zrc20
        0, // amount
        callbackMessage
      );

      // Step 7: Verify final status
      console.log("Step 7: Verifying final status...");
      request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(3); // Completed = 3
      expect(request.tokenId).to.equal(1);

      // Step 8: Check user NFT history
      console.log("Step 8: Checking user history...");
      const history = await chainWeave.getUserNFTHistory(user1.address);
      expect(history.requestIds.length).to.equal(1);
      expect(history.requestIds[0]).to.equal(requestId);
      expect(history.chainIds[0]).to.equal(destinationChainId);
      expect(history.tokenIds[0]).to.equal(1);

      console.log("✅ End-to-end flow completed successfully!");
    });
  });

  describe("Error Handling and Resilience", function () {
    it("Should handle minting failures gracefully", async function () {
      const { 
        chainWeave, 
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

      // Simulate failure callback using onCall with failed mint
      const revertMessage = ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bool", "uint256", "string"],
        [requestId, false, 0, "Mint failed on destination chain"]
      );

      const mockContext = {
        sender: ethers.utils.arrayify("0x1234"),
        senderEVM: user1.address,
        chainID: 11155111
      };

      await chainWeave.connect(owner).onCall(
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
        ethMinter,
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("duplicate-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/duplicate";

      // First mint should succeed
      await ethMinter.connect(owner).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      // Second mint with same request ID should fail
      await expect(
        ethMinter.connect(owner).mintFromChainWeave(
          requestId,
          user1.address,
          tokenURI
        )
      ).to.be.revertedWithCustomError(ethMinter, "TokenAlreadyMinted");
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

      const history = await chainWeave.getUserNFTHistory(user1.address);
      expect(history.requestIds.length).to.equal(batchSize);
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
        ethMinter,
        owner,
        user1 
      } = await loadFixture(deployIntegrationFixture);

      const initialSupply = await ethMinter.totalSupply();
      const initialBalance = await ethMinter.balanceOf(user1.address);

      // Mint an NFT using owner as the authorized caller
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("consistency-test"));
      const tokenURI = "https://api.chainweave.ai/metadata/consistency";

      await ethMinter.connect(owner).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      // Verify state consistency
      expect(await ethMinter.totalSupply()).to.equal(initialSupply + 1n);
      expect(await ethMinter.balanceOf(user1.address)).to.equal(initialBalance + 1n);
      
      const tokenId = await ethMinter.requestToTokenId(requestId);
      expect(await ethMinter.tokenIdToRequest(tokenId)).to.equal(requestId);
      expect(await ethMinter.ownerOf(tokenId)).to.equal(user1.address);
      expect(await ethMinter.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });
});
