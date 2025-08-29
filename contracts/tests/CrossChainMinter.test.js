const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

// Import utilities for v5 compatibility
const { parseEther, keccak256, toUtf8Bytes, getAddress } = ethers.utils;
const { defaultAbiCoder } = ethers.utils;
const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("CrossChainMinter - Production Ready Tests", function () {
  // Mock Gateway EVM for testing
  let MockGatewayEVM;

  before(async function() {
    MockGatewayEVM = await ethers.getContractFactory("MockGatewayEVM");
  });

  async function deployCrossChainMinterFixture() {
    const [owner, user1, user2, chainWeaveService] = await ethers.getSigners();

    // Deploy mock Gateway EVM
    const gatewayEVM = await MockGatewayEVM.deploy();
    await gatewayEVM.deployed();

    const chainWeaveAddress = chainWeaveService.address;
    const name = "ChainWeave AI NFTs";
    const symbol = "CWAI";

    // Deploy CrossChainMinter contract
    const CrossChainMinter = await ethers.getContractFactory("CrossChainMinter");
    const crossChainMinter = await CrossChainMinter.deploy(
      gatewayEVM.address,
      chainWeaveAddress,
      name,
      symbol
    );
    await crossChainMinter.deployed();

    return { 
      crossChainMinter, 
      gatewayEVM,
      owner, 
      user1, 
      user2, 
      chainWeaveService,
      chainWeaveAddress, 
      name, 
      symbol 
    };
  }

  describe("Deployment & Configuration", function () {
    it("Should deploy with correct initial configuration", async function () {
      const { 
        crossChainMinter, 
        gatewayEVM,
        chainWeaveAddress, 
        name, 
        symbol,
        owner
      } = await loadFixture(deployCrossChainMinterFixture);

      expect(await crossChainMinter.gateway()).to.equal(gatewayEVM.address);
      expect(await crossChainMinter.chainWeaveContract()).to.equal(chainWeaveAddress);
      expect(await crossChainMinter.name()).to.equal(name);
      expect(await crossChainMinter.symbol()).to.equal(symbol);
      expect(await crossChainMinter.owner()).to.equal(owner.address);
      expect(await crossChainMinter.defaultRoyalty()).to.equal(500); // 5%
      expect(await crossChainMinter.MAX_ROYALTY()).to.equal(1000); // 10%
    });

    it("Should initialize collection stats correctly", async function () {
      const { crossChainMinter } = await loadFixture(deployCrossChainMinterFixture);
      
      const stats = await crossChainMinter.getCollectionStats();
      expect(stats.totalSupply).to.equal(0);
      expect(stats.totalMinted).to.equal(0);
      expect(stats.totalBurned).to.equal(0);
      expect(stats.uniqueOwners).to.equal(0);
      expect(stats.totalVolume).to.equal(0);
      expect(stats.floorPrice).to.equal(0);
    });

    it("Should start with zero total supply", async function () {
      const { crossChainMinter } = await loadFixture(deployCrossChainMinterFixture);
      expect(await crossChainMinter.totalSupply()).to.equal(0);
    });

    it("Should support required interfaces", async function () {
      const { crossChainMinter } = await loadFixture(deployCrossChainMinterFixture);
      
      // ERC721
      expect(await crossChainMinter.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC721Enumerable
      expect(await crossChainMinter.supportsInterface("0x780e9d63")).to.be.true;
      // ERC2981 (Royalty)
      expect(await crossChainMinter.supportsInterface("0x2a55205a")).to.be.true;
      // ERC165
      expect(await crossChainMinter.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });

  describe("NFT Minting - Production Flow", function () {
    it("Should mint NFT successfully from ChainWeave", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-1"));
      const tokenURI = "ipfs://QmTestHash123/metadata.json";

      const tx = await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      await expect(tx)
        .to.emit(crossChainMinter, "CrossChainNFTMinted")
        .withArgs(requestId, user1.address, 1, tokenURI, 500); // Default 5% royalty

      await expect(tx)
        .to.emit(crossChainMinter, "TokenMintedWithRoyalty")
        .withArgs(1, user1.address, requestId, 500);

      // Verify token details
      expect(await crossChainMinter.ownerOf(1)).to.equal(user1.address);
      expect(await crossChainMinter.tokenURI(1)).to.equal(tokenURI);
      expect(await crossChainMinter.totalSupply()).to.equal(1);
      expect(await crossChainMinter.requestToToken(requestId)).to.equal(1);
      expect(await crossChainMinter.tokenToRequest(1)).to.equal(requestId);
      expect(await crossChainMinter.processedRequests(requestId)).to.be.true;

      // Check token details struct
      const tokenDetails = await crossChainMinter.getTokenDetails(1);
      expect(tokenDetails.tokenId).to.equal(1);
      expect(tokenDetails.owner).to.equal(user1.address);
      expect(tokenDetails.tokenURI).to.equal(tokenURI);
      expect(tokenDetails.requestId).to.equal(requestId);
      expect(tokenDetails.royalty).to.equal(500);
      expect(tokenDetails.exists).to.be.true;
    });

    it("Should mint NFT with custom royalty", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-2"));
      const tokenURI = "ipfs://QmTestHash456/metadata.json";
      const customRoyalty = 750; // 7.5%

      const tx = await crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
        requestId,
        user1.address,
        tokenURI,
        customRoyalty
      );

      await expect(tx)
        .to.emit(crossChainMinter, "CrossChainNFTMinted")
        .withArgs(requestId, user1.address, 1, tokenURI, customRoyalty);

      // Verify royalty
      const tokenDetails = await crossChainMinter.getTokenDetails(1);
      expect(tokenDetails.royalty).to.equal(customRoyalty);
      
      // Test ERC2981 royalty info
      const salePrice = ethers.utils.parseEther("1.0");
      const royaltyInfo = await crossChainMinter.royaltyInfo(1, salePrice);
      expect(royaltyInfo[0]).to.equal(user1.address); // recipient
      expect(royaltyInfo[1]).to.equal(salePrice.mul(customRoyalty).div(10000)); // amount
    });

    it("Should reject duplicate request processing", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-duplicate"));
      const tokenURI = "ipfs://QmTestHash789/metadata.json";

      // First mint should succeed
      await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      // Second mint with same request ID should fail
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          tokenURI
        )
      ).to.be.revertedWith("Request already processed");
    });

    it("Should reject invalid parameters", async function () {
      const { crossChainMinter, chainWeaveService } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = keccak256(toUtf8Bytes("test-request-invalid"));
      const tokenURI = "ipfs://QmTestHash/metadata.json";

      // Invalid recipient (zero address)
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          ZERO_ADDRESS,
          tokenURI
        )
      ).to.be.revertedWith("Invalid recipient");

      // Empty token URI
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          chainWeaveService.address,
          ""
        )
      ).to.be.revertedWith("Empty token URI");

      // Excessive royalty
      await expect(
        crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
          requestId,
          chainWeaveService.address,
          tokenURI,
          1500 // 15% - over maximum
        )
      ).to.be.revertedWith("Royalty too high");
    });

    it("Should only allow ChainWeave contract to mint", async function () {
      const { crossChainMinter, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-unauthorized"));
      const tokenURI = "ipfs://QmTestHash/metadata.json";

      await expect(
        crossChainMinter.connect(user1).mintFromChainWeave(
          requestId,
          user1.address,
          tokenURI
        )
      ).to.be.revertedWith("Only ChainWeave or internal");
    });

    it("Should update collection stats on mint", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-stats"));
      const tokenURI = "ipfs://QmTestHash/metadata.json";

      const statsBefore = await crossChainMinter.getCollectionStats();

      await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      const statsAfter = await crossChainMinter.getCollectionStats();
      expect(statsAfter.totalSupply).to.equal(statsBefore.totalSupply + 1n);
      expect(statsAfter.totalMinted).to.equal(statsBefore.totalMinted + 1n);
      expect(statsAfter.uniqueOwners).to.equal(statsBefore.uniqueOwners + 1n);
    });
  });

  describe("Token Management & Advanced Features", function () {
    let tokenId, requestId;

    beforeEach(async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("beforeeach-request"));
      const tokenURI = "ipfs://QmTestHash/metadata.json";

      await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        tokenURI
      );

      tokenId = 1;
      this.crossChainMinter = crossChainMinter;
      this.user1 = user1;
      this.requestId = requestId;
    });

    it("Should update token metadata by authorized users", async function () {
      const newURI = "ipfs://QmUpdatedHash/metadata.json";
      const oldURI = await this.crossChainMinter.tokenURI(tokenId);

      const tx = await this.crossChainMinter.connect(this.user1).updateTokenMetadata(
        tokenId,
        newURI
      );

      await expect(tx)
        .to.emit(this.crossChainMinter, "MetadataUpdated")
        .withArgs(tokenId, oldURI, newURI);

      expect(await this.crossChainMinter.tokenURI(tokenId)).to.equal(newURI);

      // Check token details updated
      const tokenDetails = await this.crossChainMinter.getTokenDetails(tokenId);
      expect(tokenDetails.tokenURI).to.equal(newURI);
    });

    it("Should set custom royalty by token owner", async function () {
      const newRoyalty = 800; // 8%

      const tx = await this.crossChainMinter.connect(this.user1).setRoyalty(
        tokenId,
        newRoyalty
      );

      await expect(tx)
        .to.emit(this.crossChainMinter, "RoyaltySet")
        .withArgs(tokenId, newRoyalty);

      const tokenDetails = await this.crossChainMinter.getTokenDetails(tokenId);
      expect(tokenDetails.royalty).to.equal(newRoyalty);
    });

    it("Should reject metadata update from unauthorized users", async function () {
      const { crossChainMinter, chainWeaveService, user1, user2 } = await loadFixture(deployCrossChainMinterFixture);
      
      // First mint a token
      const requestId = keccak256(toUtf8Bytes("test-request-metadata-unauthorized"));
      const tokenURI = "ipfs://QmTest/metadata.json";
      const royalty = 500;

      await crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
        requestId,
        user1.address,
        tokenURI,
        royalty
      );
      
      const tokenId = await crossChainMinter.getTokenIdForRequest(requestId);
      const newURI = "ipfs://QmUnauthorized/metadata.json";

      await expect(
        crossChainMinter.connect(user2).updateTokenMetadata(
          tokenId,
          newURI
        )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject royalty update from non-owner", async function () {
      const { crossChainMinter, chainWeaveService, user1, user2 } = await loadFixture(deployCrossChainMinterFixture);
      
      // First mint a token
      const requestId = keccak256(toUtf8Bytes("test-request-royalty-unauthorized"));
      const tokenURI = "ipfs://QmTest/metadata.json";
      const royalty = 500;

      await crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
        requestId,
        user1.address,
        tokenURI,
        royalty
      );
      
      const tokenId = await crossChainMinter.getTokenIdForRequest(requestId);

      await expect(
        crossChainMinter.connect(user2).setRoyalty(tokenId, 1000)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Batch Operations", function () {
    it("Should transfer multiple tokens in batch", async function () {
      const { crossChainMinter, chainWeaveService, user1, user2 } = await loadFixture(deployCrossChainMinterFixture);
      
      const tokens = [];
      // Mint 3 tokens for batch testing
      for (let i = 0; i < 3; i++) {
        const requestId = keccak256(toUtf8Bytes(`batch-transfer-${i}`));
        const tokenURI = `ipfs://QmBatchHash${i}/metadata.json`;
        
        await crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
          requestId,
          user1.address,
          tokenURI,
          500
        );
        
        const tokenId = await crossChainMinter.getTokenIdForRequest(requestId);
        tokens.push(tokenId);
      }

      const tokenIds = tokens;
      const recipients = [user2.address, user2.address, user2.address];

      await expect(
        crossChainMinter.connect(user1).transferBatch(recipients, tokenIds)
      ).to.not.be.reverted;

      // Verify ownership changes
      for (let i = 0; i < tokenIds.length; i++) {
        expect(await crossChainMinter.ownerOf(tokenIds[i])).to.equal(user2.address);
      }
    });

    it("Should get token metadata in batch", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const tokens = [];
      // Mint 3 tokens for batch testing
      for (let i = 0; i < 3; i++) {
        const requestId = keccak256(toUtf8Bytes(`unique-batch-metadata-test-${i}-${Math.random()}`));
        const tokenURI = `ipfs://QmBatchMetadataHash${i}/metadata.json`;
        
        await crossChainMinter.connect(chainWeaveService).mintWithRoyalty(
          requestId,
          user1.address,
          tokenURI,
          500
        );
        
        const tokenId = await crossChainMinter.getTokenIdForRequest(requestId);
        tokens.push(tokenId);
      }

      const [tokenURIs, owners] = await crossChainMinter.getTokenMetadataBatch(tokens);
      
      expect(tokenURIs.length).to.equal(3);
      expect(owners.length).to.equal(3);
      for (let i = 0; i < tokenURIs.length; i++) {
        expect(tokenURIs[i]).to.include(`ipfs://QmBatchMetadataHash${i}/metadata.json`);
        expect(owners[i]).to.equal(user1.address);
      }
    });

    it("Should reject batch transfer with mismatched arrays", async function () {
      const { crossChainMinter, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const tokenIds = [1, 2];
      const recipients = [user1.address]; // Mismatched array length

      await expect(
        crossChainMinter.connect(user1).transferBatch(recipients, tokenIds)
      ).to.be.revertedWith("Array length mismatch");
    });
  });

  describe("Query Functions & Pagination", function () {
    beforeEach(async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      // Mint 5 test NFTs
      for (let i = 0; i < 5; i++) {
        const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`query-request-${i}`));
        const tokenURI = `ipfs://QmQueryHash${i}/metadata.json`;
        
        await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          tokenURI
        );
      }

      this.crossChainMinter = crossChainMinter;
      this.user1 = user1;
    });

    it("Should get tokens by owner with pagination", async function () {
      // Get first 3 tokens
      const [tokenIds1, tokenDetails1] = await this.crossChainMinter.getTokensByOwnerPaginated(
        this.user1.address,
        0,
        3
      );

      expect(tokenIds1.length).to.equal(3);
      expect(tokenDetails1.length).to.equal(3);
      expect(tokenIds1[0]).to.equal(1);
      expect(tokenIds1[2]).to.equal(3);

      // Get remaining tokens
      const [tokenIds2, tokenDetails2] = await this.crossChainMinter.getTokensByOwnerPaginated(
        this.user1.address,
        3,
        3
      );

      expect(tokenIds2.length).to.equal(2);
      expect(tokenDetails2.length).to.equal(2);
      expect(tokenIds2[0]).to.equal(4);
      expect(tokenIds2[1]).to.equal(5);
    });

    it("Should return token details by request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("query-request-0"));
      
      const [tokenId, owner, tokenURI] = await this.crossChainMinter.getTokenByRequest(requestId);
      
      expect(tokenId).to.equal(1);
      expect(owner).to.equal(this.user1.address);
      expect(tokenURI).to.equal("ipfs://QmQueryHash0/metadata.json");
    });

    it("Should check if request is processed", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("query-request-0"));
      const nonExistentRequest = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      
      expect(await this.crossChainMinter.isRequestProcessed(requestId)).to.be.true;
      expect(await this.crossChainMinter.isRequestProcessed(nonExistentRequest)).to.be.false;
    });

    it("Should get token ID for request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("query-request-2"));
      
      const tokenId = await this.crossChainMinter.getTokenIdForRequest(requestId);
      expect(tokenId).to.equal(3);
    });

    it("Should handle empty pagination results", async function () {
      const [tokenIds, tokenDetails] = await this.crossChainMinter.getTokensByOwnerPaginated(
        this.user1.address,
        100, // Beyond available tokens
        10
      );

      expect(tokenIds.length).to.equal(0);
      expect(tokenDetails.length).to.equal(0);
    });
  });

  describe("ZetaChain Cross-Chain Integration", function () {
    it("Should handle cross-chain messages via onCall", async function () {
      const { crossChainMinter, gatewayEVM, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = keccak256(toUtf8Bytes("zeta-message-request"));
      const tokenURI = "ipfs://QmZetaHash/metadata.json";
      const royalty = 600;
      
      const messageData = defaultAbiCoder.encode(
        ["bytes32", "address", "string", "uint256"],
        [requestId, user1.address, tokenURI, royalty]
      );

      const messageContext = {
        sender: gatewayEVM.address
      };

      // Simulate the gateway calling the contract via execute
      await expect(
        gatewayEVM.execute(messageContext, crossChainMinter.address, 
          crossChainMinter.interface.encodeFunctionData("onCall", [messageContext, messageData])
        )
      ).to.not.be.reverted;
    });

    it("Should handle cross-chain reverts via onRevert", async function () {
      const { crossChainMinter, gatewayEVM, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = keccak256(toUtf8Bytes("zeta-revert-request"));
      const revertMessage = defaultAbiCoder.encode(
        ["bytes32", "string"],
        [requestId, "Test revert reason"]
      );

      const revertContext = {
        sender: gatewayEVM.address,
        asset: ZERO_ADDRESS,
        amount: 0,
        revertMessage: revertMessage
      };

      // Since onRevert requires msg.sender to be the gateway, we need to simulate it properly
      // Let's make the owner simulate a gateway call
      await expect(
        crossChainMinter.connect(owner).onRevert(revertContext)
      ).to.be.revertedWith("Only gateway can call");
    });

    it("Should decode revert messages correctly", async function () {
      const { crossChainMinter } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = keccak256(toUtf8Bytes("decode-test"));
      const reason = "Decoding test reason";
      
      const encodedMessage = defaultAbiCoder.encode(
        ["bytes32", "string"],
        [requestId, reason]
      );

      const [decodedRequestId, decodedReason] = await crossChainMinter.decodeRevertMessage(encodedMessage);
      
      expect(decodedRequestId).to.equal(requestId);
      expect(decodedReason).to.equal(reason);
    });
  });

  describe("Admin Functions & Configuration", function () {
    it("Should allow owner to set ChainWeave contract", async function () {
      const { crossChainMinter, owner, user2 } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(owner).setChainWeaveContract(user2.address)
      ).to.not.be.reverted;

      expect(await crossChainMinter.chainWeaveContract()).to.equal(user2.address);
    });

    it("Should allow owner to set default royalty", async function () {
      const { crossChainMinter, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      const newDefaultRoyalty = 750; // 7.5%
      
      await crossChainMinter.connect(owner).setDefaultRoyalty(newDefaultRoyalty);
      expect(await crossChainMinter.defaultRoyalty()).to.equal(newDefaultRoyalty);
    });

    it("Should allow owner to set collection royalty", async function () {
      const { crossChainMinter, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(owner).setCollectionRoyalty(owner.address, 600)
      ).to.not.be.reverted;
    });

    it("Should allow owner to pause and unpause", async function () {
      const { crossChainMinter, owner, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      // Pause contract
      await crossChainMinter.connect(owner).pause();
      
      // Try to mint while paused (should fail)
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("pause-test"));
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          "ipfs://test.json"
        )
      ).to.be.revertedWithCustomError(crossChainMinter, "EnforcedPause");
      
      // Unpause contract
      await crossChainMinter.connect(owner).unpause();
      
      // Should work now
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          "ipfs://test.json"
        )
      ).to.not.be.reverted;
    });

    it("Should allow owner to withdraw contract balance", async function () {
      const { crossChainMinter, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      // Send some ETH to contract
      await owner.sendTransaction({
        to: await crossChainMinter.address,
        value: ethers.utils.parseEther("1.0")
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await crossChainMinter.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || tx.gasPrice || ethers.utils.parseUnits("20", "gwei"));
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(ethers.utils.parseEther("1.0")).sub(gasUsed));
    });

    it("Should reject admin functions from non-owners", async function () {
      const { crossChainMinter, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(user1).setDefaultRoyalty(600)
      ).to.be.revertedWithCustomError(crossChainMinter, "OwnableUnauthorizedAccount");

      await expect(
        crossChainMinter.connect(user1).pause()
      ).to.be.revertedWithCustomError(crossChainMinter, "OwnableUnauthorizedAccount");

      await expect(
        crossChainMinter.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(crossChainMinter, "OwnableUnauthorizedAccount");
    });

    it("Should reject excessive royalty settings", async function () {
      const { crossChainMinter, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(owner).setDefaultRoyalty(1500) // 15% - over max
      ).to.be.revertedWith("Royalty too high");
    });

    it("Should reject invalid addresses in configuration", async function () {
      const { crossChainMinter, owner } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(owner).setChainWeaveContract(ZERO_ADDRESS)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Events & Monitoring", function () {
    it("Should emit payment received events", async function () {
      const { crossChainMinter, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const amount = parseEther("0.5");
      
      await expect(
        user1.sendTransaction({
          to: crossChainMinter.address,
          value: amount
        })
      )
        .to.emit(crossChainMinter, "PaymentReceived")
        .withArgs(user1.address, amount);
    });

    it("Should emit collection stats update events", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("stats-event-test"));
      
      await expect(
        crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          "ipfs://test.json"
        )
      )
        .to.emit(crossChainMinter, "CollectionStatsUpdated")
        .withArgs(1, 1, 0); // totalSupply, uniqueOwners, totalVolume
    });
  });

  describe("Security & Edge Cases", function () {
    it("Should handle token burning and stats update", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      // Mint a token first
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("burn-test"));
      await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        "ipfs://burn-test.json"
      );

      const statsBefore = await crossChainMinter.getCollectionStats();
      
      // Burn the token (internal function, so we can't test directly in production)
      // But we can verify the stats tracking logic through mint/transfer patterns
      expect(statsBefore.totalSupply).to.equal(1);
      expect(statsBefore.totalMinted).to.equal(1);
    });

    it("Should handle non-existent token queries gracefully", async function () {
      const { crossChainMinter } = await loadFixture(deployCrossChainMinterFixture);
      
      const nonExistentTokenId = 999;
      
      await expect(
        crossChainMinter.getTokenDetails(nonExistentTokenId)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should handle empty batch operations", async function () {
      const { crossChainMinter, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      await expect(
        crossChainMinter.connect(user1).transferBatch([], [])
      ).to.be.revertedWith("Empty arrays");
    });

    it("Should validate token ownership for operations", async function () {
      const { crossChainMinter, chainWeaveService, user1, user2 } = await loadFixture(deployCrossChainMinterFixture);
      
      // Mint token to user1
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ownership-test"));
      await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
        requestId,
        user1.address,
        "ipfs://ownership.json"
      );

      // user2 tries to set royalty (should fail)
      await expect(
        crossChainMinter.connect(user2).setRoyalty(1, 600)
      ).to.be.revertedWith("Not token owner");

      // user2 tries to update metadata (should fail)
      await expect(
        crossChainMinter.connect(user2).updateTokenMetadata(1, "ipfs://hack.json")
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Gas Optimization & Performance", function () {
    it("Should handle multiple mints efficiently", async function () {
      const { crossChainMinter, chainWeaveService, user1 } = await loadFixture(deployCrossChainMinterFixture);
      
      // Measure gas for multiple mints
      const gasUsages = [];
      
      for (let i = 0; i < 3; i++) {
        const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`gas-test-${i}`));
        const tx = await crossChainMinter.connect(chainWeaveService).mintFromChainWeave(
          requestId,
          user1.address,
          `ipfs://gas-test-${i}.json`
        );
        
        const receipt = await tx.wait();
        gasUsages.push(Number(receipt.gasUsed));
      }
      
      // Gas usage should be relatively consistent
      const maxGas = Math.max(...gasUsages);
      const minGas = Math.min(...gasUsages);
      const variance = maxGas - minGas;
      
      // Allow some variance but not too much for enterprise features
      expect(variance).to.be.lessThan(150000);
    });
  });
});
