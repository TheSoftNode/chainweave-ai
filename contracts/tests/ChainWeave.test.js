const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ChainWeave - Production Ready Tests", function () {
  // Mock system contract for testing
  let MockSystemContract;

  before(async function() {
    MockSystemContract = await ethers.getContractFactory("MockSystemContract");
  });

  async function deployChainWeaveFixture() {
    const [owner, user1, user2, backendService] = await ethers.getSigners();

    // Deploy mock system contract
    const systemContract = await MockSystemContract.deploy();
    await systemContract.waitForDeployment();

    // Deploy ChainWeave contract
    const ChainWeave = await ethers.getContractFactory("ChainWeave");
    const chainWeave = await ChainWeave.deploy(
      await systemContract.getAddress(),
      backendService.address
    );
    await chainWeave.waitForDeployment();

    // Setup supported chains
    const ethereumChainId = 11155111; // Sepolia
    const polygonChainId = 80001; // Mumbai
    const mockMinterAddress = "0x1234567890123456789012345678901234567890";

    await chainWeave.connect(owner).addSupportedChain(ethereumChainId, mockMinterAddress);
    await chainWeave.connect(owner).addSupportedChain(polygonChainId, mockMinterAddress);

    return { 
      chainWeave, 
      systemContract, 
      owner, 
      user1, 
      user2, 
      backendService,
      ethereumChainId,
      polygonChainId,
      mockMinterAddress
    };
  }

  describe("Deployment & Configuration", function () {
    it("Should deploy with correct initial configuration", async function () {
      const { chainWeave, systemContract, backendService, owner } = await loadFixture(deployChainWeaveFixture);
      
      expect(await chainWeave.systemContract()).to.equal(await systemContract.getAddress());
      expect(await chainWeave.backendService()).to.equal(backendService.address);
      expect(await chainWeave.owner()).to.equal(owner.address);
      expect(await chainWeave.getRequestFee()).to.equal(ethers.parseEther("0.001"));
    });

    it("Should initialize platform stats correctly", async function () {
      const { chainWeave } = await loadFixture(deployChainWeaveFixture);
      
      const stats = await chainWeave.getPlatformStats();
      expect(stats.totalRequests).to.equal(0);
      expect(stats.completedMints).to.equal(0);
      expect(stats.totalFees).to.equal(0);
      expect(stats.activeChains).to.equal(2); // Ethereum and Polygon added in fixture
    });

    it("Should support multiple chains", async function () {
      const { chainWeave, ethereumChainId, polygonChainId, mockMinterAddress } = await loadFixture(deployChainWeaveFixture);
      
      expect(await chainWeave.supportedChains(ethereumChainId)).to.be.true;
      expect(await chainWeave.supportedChains(polygonChainId)).to.be.true;
      expect(await chainWeave.minterContracts(ethereumChainId)).to.equal(mockMinterAddress);
      expect(await chainWeave.minterContracts(polygonChainId)).to.equal(mockMinterAddress);
    });
  });

  describe("NFT Mint Requests - Production Flow", function () {
    it("Should create valid NFT mint request with proper fee", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "A vibrant digital artwork showcasing AI creativity";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
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
      
      const parsedEvent = chainWeave.interface.parseLog(event);
      const requestId = parsedEvent.args.requestId;

      // Verify request details
      const request = await chainWeave.getMintRequest(requestId);
      expect(request.sender).to.equal(user1.address);
      expect(request.prompt).to.equal(prompt);
      expect(request.destinationChainId).to.equal(ethereumChainId);
      expect(request.status).to.equal(0); // RequestStatus.Pending
      expect(request.fee).to.equal(fee);
    });

    it("Should reject requests with insufficient fee", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const insufficientFee = ethers.parseEther("0.0005");

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          recipient,
          { value: insufficientFee }
        )
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should reject requests for unsupported chains", async function () {
      const { chainWeave, user1 } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();
      const unsupportedChainId = 999999;

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          unsupportedChainId,
          recipient,
          { value: fee }
        )
      ).to.be.revertedWith("Unsupported chain");
    });

    it("Should refund excess payment", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();
      const excessPayment = fee * 2n; // Double the required fee

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: excessPayment }
      );
      
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Should only charge the fee amount, not the excess
      expect(balanceAfter).to.equal(balanceBefore - fee - gasUsed);
    });

    it("Should update platform statistics on request", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      const statsBefore = await chainWeave.getPlatformStats();

      await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
      );

      const statsAfter = await chainWeave.getPlatformStats();
      expect(statsAfter.totalRequests).to.equal(statsBefore.totalRequests + 1n);
      expect(statsAfter.totalFees).to.equal(statsBefore.totalFees + fee);
    });
  });

  describe("Backend AI Generation Integration", function () {
    let requestId;

    beforeEach(async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "AI-generated artwork";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
        } catch {
          return false;
        }
      });

      requestId = chainWeave.interface.parseLog(event).args.requestId;
      this.requestId = requestId;
      this.chainWeave = chainWeave;
    });

    it("Should allow backend service to complete AI generation", async function () {
      const { backendService } = await loadFixture(deployChainWeaveFixture);
      const tokenURI = "ipfs://QmTestHash123/metadata.json";

      const tx = await this.chainWeave.connect(backendService).completeAIGeneration(
        this.requestId,
        tokenURI
      );

      await expect(tx)
        .to.emit(this.chainWeave, "AIGenerationCompleted")
        .withArgs(this.requestId, tokenURI);

      const request = await this.chainWeave.getMintRequest(this.requestId);
      expect(request.status).to.equal(2); // RequestStatus.AICompleted
      expect(request.tokenURI).to.equal(tokenURI);
    });

    it("Should reject AI completion from non-backend service", async function () {
      const { user1 } = await loadFixture(deployChainWeaveFixture);
      const tokenURI = "ipfs://QmTestHash123/metadata.json";

      await expect(
        this.chainWeave.connect(user1).completeAIGeneration(
          this.requestId,
          tokenURI
        )
      ).to.be.revertedWith("Only backend service");
    });

    it("Should allow backend service to update metadata", async function () {
      const { backendService } = await loadFixture(deployChainWeaveFixture);
      const initialURI = "ipfs://QmTestHash123/metadata.json";
      const updatedURI = "ipfs://QmUpdatedHash456/metadata.json";

      // Complete AI generation first
      await this.chainWeave.connect(backendService).completeAIGeneration(
        this.requestId,
        initialURI
      );

      // Update metadata
      await this.chainWeave.connect(backendService).updateRequestMetadata(
        this.requestId,
        updatedURI
      );

      const request = await this.chainWeave.getMintRequest(this.requestId);
      expect(request.tokenURI).to.equal(updatedURI);
    });
  });

  describe("Request Management & Status Tracking", function () {
    it("Should track requests by status", async function () {
      const { chainWeave, user1, backendService, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      // Create multiple requests
      const requests = [];
      for (let i = 0; i < 3; i++) {
        const prompt = `Test prompt ${i}`;
        const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
        const fee = await chainWeave.getRequestFee();

        const tx = await chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          recipient,
          { value: fee }
        );

        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
          try {
            return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
          } catch {
            return false;
          }
        });
        requests.push(chainWeave.interface.parseLog(event).args.requestId);
      }

      // All should be pending
      const pendingRequests = await chainWeave.getRequestsByStatus(0, 0, 10); // Pending status
      expect(pendingRequests.length).to.equal(3);

      // Complete one request
      await chainWeave.connect(backendService).completeAIGeneration(
        requests[0],
        "ipfs://test1.json"
      );

      // Check status distribution
      const aiCompletedRequests = await chainWeave.getRequestsByStatus(2, 0, 10); // AICompleted status
      expect(aiCompletedRequests.length).to.equal(1);
      expect(aiCompletedRequests[0]).to.equal(requests[0]);
    });

    it("Should support pagination for user requests", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      // Create 5 requests
      for (let i = 0; i < 5; i++) {
        const prompt = `Test prompt ${i}`;
        const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
        const fee = await chainWeave.getRequestFee();

        await chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          recipient,
          { value: fee }
        );
      }

      // Test pagination
      const page1 = await chainWeave.getUserRequestsPaginated(user1.address, 0, 3);
      expect(page1.requestIds.length).to.equal(3);
      expect(page1.requests.length).to.equal(3);

      const page2 = await chainWeave.getUserRequestsPaginated(user1.address, 3, 3);
      expect(page2.requestIds.length).to.equal(2);
      expect(page2.requests.length).to.equal(2);
    });

    it("Should allow users to cancel pending requests", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
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

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      // Cancel the request
      const cancelTx = await chainWeave.connect(user1).cancelRequest(requestId);
      
      await expect(cancelTx)
        .to.emit(chainWeave, "RequestCancelled")
        .withArgs(requestId, user1.address);

      // Check status
      const request = await chainWeave.getMintRequest(requestId);
      expect(request.status).to.equal(6); // RequestStatus.Cancelled

      // Check refund
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const gasUsed = (await cancelTx.wait()).gasUsed * (await cancelTx.wait()).gasPrice;
      expect(balanceAfter).to.equal(balanceBefore + fee - gasUsed);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to manage supported chains", async function () {
      const { chainWeave, owner } = await loadFixture(deployChainWeaveFixture);
      
      const newChainId = 137; // Polygon Mainnet
      const minterAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef";

      // Add new chain
      const addTx = await chainWeave.connect(owner).addSupportedChain(newChainId, minterAddress);
      
      await expect(addTx)
        .to.emit(chainWeave, "ChainSupported")
        .withArgs(newChainId, minterAddress);

      expect(await chainWeave.supportedChains(newChainId)).to.be.true;
      expect(await chainWeave.minterContracts(newChainId)).to.equal(minterAddress);

      // Remove chain
      const removeTx = await chainWeave.connect(owner).removeSupportedChain(newChainId);
      
      await expect(removeTx)
        .to.emit(chainWeave, "ChainUnsupported")
        .withArgs(newChainId);

      expect(await chainWeave.supportedChains(newChainId)).to.be.false;
    });

    it("Should allow owner to update request fee", async function () {
      const { chainWeave, owner } = await loadFixture(deployChainWeaveFixture);
      
      const newFee = ethers.parseEther("0.002");
      const oldFee = await chainWeave.getRequestFee();

      const tx = await chainWeave.connect(owner).setRequestFee(newFee);
      
      await expect(tx)
        .to.emit(chainWeave, "RequestFeeUpdated")
        .withArgs(oldFee, newFee);

      expect(await chainWeave.getRequestFee()).to.equal(newFee);
    });

    it("Should allow owner to update backend service", async function () {
      const { chainWeave, owner, user2 } = await loadFixture(deployChainWeaveFixture);
      
      const oldService = await chainWeave.backendService();
      
      const tx = await chainWeave.connect(owner).setBackendService(user2.address);
      
      await expect(tx)
        .to.emit(chainWeave, "BackendServiceUpdated")
        .withArgs(oldService, user2.address);

      expect(await chainWeave.backendService()).to.equal(user2.address);
    });

    it("Should allow owner to pause and unpause contract", async function () {
      const { chainWeave, owner, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      // Pause contract
      await chainWeave.connect(owner).pause();

      // Try to make request while paused
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          recipient,
          { value: fee }
        )
      ).to.be.revertedWith("Pausable: paused");

      // Unpause contract
      await chainWeave.connect(owner).unpause();

      // Should work now
      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          recipient,
          { value: fee }
        )
      ).to.not.be.reverted;
    });

    it("Should allow owner to withdraw accumulated fees", async function () {
      const { chainWeave, owner, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      // Generate some fee revenue
      const prompt = "Test prompt";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
      );

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await chainWeave.getAddress());

      const tx = await chainWeave.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance - gasUsed);
    });
  });

  describe("Security & Edge Cases", function () {
    it("Should prevent non-owners from accessing admin functions", async function () {
      const { chainWeave, user1 } = await loadFixture(deployChainWeaveFixture);
      
      await expect(
        chainWeave.connect(user1).setRequestFee(ethers.parseEther("0.002"))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        chainWeave.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        chainWeave.connect(user1).withdrawFees()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should handle empty prompt rejection", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const emptyPrompt = "";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          emptyPrompt,
          ethereumChainId,
          recipient,
          { value: fee }
        )
      ).to.be.revertedWith("Empty prompt");
    });

    it("Should handle empty recipient rejection", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt";
      const emptyRecipient = "0x";
      const fee = await chainWeave.getRequestFee();

      await expect(
        chainWeave.connect(user1).requestNFTMint(
          prompt,
          ethereumChainId,
          emptyRecipient,
          { value: fee }
        )
      ).to.be.revertedWith("Empty recipient");
    });

    it("Should handle fee limits properly", async function () {
      const { chainWeave, owner } = await loadFixture(deployChainWeaveFixture);
      
      const maxFee = ethers.parseEther("1.0");
      const excessiveFee = ethers.parseEther("2.0");

      // Should accept max fee
      await expect(
        chainWeave.connect(owner).setRequestFee(maxFee)
      ).to.not.be.reverted;

      // Should reject excessive fee
      await expect(
        chainWeave.connect(owner).setRequestFee(excessiveFee)
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("Events & Monitoring", function () {
    it("Should emit proper events for monitoring", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const prompt = "Test prompt for event monitoring";
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const fee = await chainWeave.getRequestFee();

      const tx = await chainWeave.connect(user1).requestNFTMint(
        prompt,
        ethereumChainId,
        recipient,
        { value: fee }
      );

      // Should emit NFTMintRequested event with all required data
      await expect(tx).to.emit(chainWeave, "NFTMintRequested");
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return chainWeave.interface.parseLog(log).name === "NFTMintRequested";
        } catch {
          return false;
        }
      });

      const parsedEvent = chainWeave.interface.parseLog(event);
      expect(parsedEvent.args.sender).to.equal(user1.address);
      expect(parsedEvent.args.destinationChainId).to.equal(ethereumChainId);
      expect(parsedEvent.args.prompt).to.equal(prompt);
      expect(parsedEvent.args.fee).to.equal(fee);
    });

    it("Should emit fee received events", async function () {
      const { chainWeave, user1 } = await loadFixture(deployChainWeaveFixture);
      
      const amount = ethers.parseEther("0.1");
      
      const tx = await user1.sendTransaction({
        to: await chainWeave.getAddress(),
        value: amount
      });

      await expect(tx)
        .to.emit(chainWeave, "FeeReceived")
        .withArgs(user1.address, amount);
    });
  });

  describe("Gas Optimization", function () {
    it("Should handle multiple requests efficiently", async function () {
      const { chainWeave, user1, ethereumChainId } = await loadFixture(deployChainWeaveFixture);
      
      const fee = await chainWeave.getRequestFee();
      const recipient = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);

      // Measure gas for first request
      const tx1 = await chainWeave.connect(user1).requestNFTMint(
        "First prompt",
        ethereumChainId,
        recipient,
        { value: fee }
      );
      const receipt1 = await tx1.wait();

      // Measure gas for subsequent request
      const tx2 = await chainWeave.connect(user1).requestNFTMint(
        "Second prompt",
        ethereumChainId,
        recipient,
        { value: fee }
      );
      const receipt2 = await tx2.wait();

      // Gas usage should be consistent
      const gasDifference = Math.abs(Number(receipt2.gasUsed - receipt1.gasUsed));
      expect(gasDifference).to.be.lessThan(50000); // Allow some variance
    });
  });
});

// Mock System Contract for testing
contract("MockSystemContract", function() {
  function MockSystemContract() {}
  
  MockSystemContract.prototype.crossChainCall = function(chainId, target, data, gasLimit) {
    return true;
  };

  MockSystemContract.prototype.onCrossChainCall = function(context, target, data) {
    return "0x";
  };

  return MockSystemContract;
});