// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/IGatewayEVM.sol";
import "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "../interfaces/ICrossChainMinter.sol";

/**
 * @title CrossChainMinter
 * @notice ERC-721 NFT contract for cross-chain AI-generated NFTs
 * @dev Production-ready contract deployed on destination chains (Ethereum, BSC, Polygon, etc.)
 */
contract CrossChainMinter is
    ICrossChainMinter,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC2981,
    Ownable,
    ReentrancyGuard,
    Pausable,
    Callable,
    Revertable
{
    /// @notice Token ID counter
    uint256 private _tokenIds;

    /// @notice ChainWeave contract address on ZetaChain
    address public chainWeaveContract;

    /// @notice Gateway contract for cross-chain communication
    GatewayEVM public gateway;

    /// @notice Maximum royalty percentage (10% = 1000 basis points)
    uint256 public constant MAX_ROYALTY = 1000;

    /// @notice Default royalty percentage for new tokens (5% = 500 basis points)
    uint256 public defaultRoyalty = 500;

    /// @notice Mapping from request ID to token ID
    mapping(bytes32 => uint256) public requestToToken;

    /// @notice Mapping from token ID to request ID
    mapping(uint256 => bytes32) public tokenToRequest;

    /// @notice Mapping to track processed requests
    mapping(bytes32 => bool) public processedRequests;

    /// @notice Token details storage
    mapping(uint256 => TokenDetails) public tokenDetails;

    /// @notice Collection statistics
    CollectionStats public collectionStats;

    /// @notice Array to track unique owners for stats
    address[] private uniqueOwners;
    mapping(address => bool) private isUniqueOwner;

    /// @notice Events for advanced functionality
    event TokenMintedWithRoyalty(
        uint256 indexed tokenId,
        address indexed recipient,
        bytes32 indexed requestId,
        uint256 royalty
    );

    event CollectionStatsUpdated(
        uint256 totalSupply,
        uint256 uniqueOwners,
        uint256 totalVolume
    );

    /// @notice Modifiers
    modifier onlyChainWeave() {
        require(msg.sender == chainWeaveContract, "Only ChainWeave contract");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    /**
     * @notice Initialize the CrossChainMinter contract
     * @param gatewayAddress Address of the Gateway contract
     * @param _chainWeaveContract Address of ChainWeave contract on ZetaChain
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     */
    constructor(
        address gatewayAddress,
        address _chainWeaveContract,
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        gateway = GatewayEVM(gatewayAddress);
        chainWeaveContract = _chainWeaveContract;

        // Initialize collection stats
        collectionStats.totalSupply = 0;
        collectionStats.totalMinted = 0;
        collectionStats.totalBurned = 0;
        collectionStats.uniqueOwners = 0;
        collectionStats.totalVolume = 0;
        collectionStats.floorPrice = 0;
    }

    /**
     * @notice Mint an NFT from a cross-chain request
     */
    function mintFromChainWeave(
        bytes32 requestId,
        address recipient,
        string memory _tokenURI
    ) external nonReentrant whenNotPaused returns (uint256 tokenId) {
        require(
            msg.sender == chainWeaveContract || msg.sender == address(this),
            "Only ChainWeave or internal"
        );
        require(recipient != address(0), "Invalid recipient");
        require(bytes(_tokenURI).length > 0, "Empty token URI");
        require(!processedRequests[requestId], "Request already processed");

        // Mark request as processed
        processedRequests[requestId] = true;

        // Increment token ID and mint
        _tokenIds++;
        tokenId = _tokenIds;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Set default royalty for the token
        _setTokenRoyalty(tokenId, recipient, uint96(defaultRoyalty));

        // Store token details
        tokenDetails[tokenId] = TokenDetails({
            tokenId: tokenId,
            owner: recipient,
            tokenURI: _tokenURI,
            requestId: requestId,
            mintTimestamp: block.timestamp,
            royalty: defaultRoyalty,
            exists: true
        });

        // Update mappings
        requestToToken[requestId] = tokenId;
        tokenToRequest[tokenId] = requestId;

        // Update collection stats
        _updateCollectionStats(recipient, true, 0);

        emit CrossChainNFTMinted(
            requestId,
            recipient,
            tokenId,
            _tokenURI,
            defaultRoyalty
        );
        emit TokenMintedWithRoyalty(
            tokenId,
            recipient,
            requestId,
            defaultRoyalty
        );

        return tokenId;
    }

    /**
     * @notice Mint an NFT with custom royalty settings
     */
    function mintWithRoyalty(
        bytes32 requestId,
        address recipient,
        string memory _tokenURI,
        uint256 royalty
    ) external nonReentrant whenNotPaused returns (uint256 tokenId) {
        require(
            msg.sender == chainWeaveContract || msg.sender == address(this),
            "Only ChainWeave or internal"
        );
        require(recipient != address(0), "Invalid recipient");
        require(bytes(_tokenURI).length > 0, "Empty token URI");
        require(royalty <= MAX_ROYALTY, "Royalty too high");
        require(!processedRequests[requestId], "Request already processed");

        // Mark request as processed
        processedRequests[requestId] = true;

        // Increment token ID and mint
        _tokenIds++;
        tokenId = _tokenIds;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Set custom royalty for the token
        _setTokenRoyalty(tokenId, recipient, uint96(royalty));

        // Store token details
        tokenDetails[tokenId] = TokenDetails({
            tokenId: tokenId,
            owner: recipient,
            tokenURI: _tokenURI,
            requestId: requestId,
            mintTimestamp: block.timestamp,
            royalty: royalty,
            exists: true
        });

        // Update mappings
        requestToToken[requestId] = tokenId;
        tokenToRequest[tokenId] = requestId;

        // Update collection stats
        _updateCollectionStats(recipient, true, 0);

        emit CrossChainNFTMinted(
            requestId,
            recipient,
            tokenId,
            _tokenURI,
            royalty
        );
        emit TokenMintedWithRoyalty(tokenId, recipient, requestId, royalty);

        return tokenId;
    }

    /**
     * @notice Update token metadata (owner or authorized only)
     */
    function updateTokenMetadata(
        uint256 tokenId,
        string memory newURI
    ) external tokenExists(tokenId) nonReentrant {
        require(
            ownerOf(tokenId) == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not authorized"
        );
        require(bytes(newURI).length > 0, "Empty URI");

        string memory oldURI = tokenURI(tokenId);
        _setTokenURI(tokenId, newURI);

        // Update stored details
        tokenDetails[tokenId].tokenURI = newURI;

        emit MetadataUpdated(tokenId, oldURI, newURI);
    }

    /**
     * @notice Set royalty for a token (owner only)
     */
    function setRoyalty(
        uint256 tokenId,
        uint256 royalty
    ) external tokenExists(tokenId) onlyTokenOwner(tokenId) {
        require(royalty <= MAX_ROYALTY, "Royalty too high");

        _setTokenRoyalty(tokenId, ownerOf(tokenId), uint96(royalty));
        tokenDetails[tokenId].royalty = royalty;

        emit RoyaltySet(tokenId, royalty);
    }

    /**
     * @notice Transfer multiple tokens to different recipients
     */
    function transferBatch(
        address[] memory recipients,
        uint256[] memory tokenIds
    ) external nonReentrant {
        require(recipients.length == tokenIds.length, "Array length mismatch");
        require(recipients.length > 0, "Empty arrays");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(recipients[i] != address(0), "Invalid recipient");

            safeTransferFrom(msg.sender, recipients[i], tokenIds[i]);
        }

        emit BatchTransfer(msg.sender, recipients, tokenIds);
    }

    /**
     * @notice Get tokens owned by an address with pagination
     */
    function getTokensByOwnerPaginated(
        address owner,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (
            uint256[] memory tokenIds,
            TokenDetails[] memory tokenDetailsArray
        )
    {
        uint256 ownerBalance = balanceOf(owner);

        if (offset >= ownerBalance) {
            return (new uint256[](0), new TokenDetails[](0));
        }

        uint256 end = offset + limit;
        if (end > ownerBalance) {
            end = ownerBalance;
        }

        uint256 length = end - offset;
        tokenIds = new uint256[](length);
        tokenDetailsArray = new TokenDetails[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, offset + i);
            tokenIds[i] = tokenId;
            tokenDetailsArray[i] = tokenDetails[tokenId];
        }

        return (tokenIds, tokenDetailsArray);
    }

    /**
     * @notice Get metadata for multiple tokens
     */
    function getTokenMetadataBatch(
        uint256[] memory tokenIds
    )
        external
        view
        returns (string[] memory tokenURIs, address[] memory owners)
    {
        tokenURIs = new string[](tokenIds.length);
        owners = new address[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_ownerOf(tokenIds[i]) != address(0)) {
                tokenURIs[i] = tokenURI(tokenIds[i]);
                owners[i] = ownerOf(tokenIds[i]);
            }
        }

        return (tokenURIs, owners);
    }

    /**
     * @notice Get detailed token information
     */
    function getTokenDetails(
        uint256 tokenId
    ) external view tokenExists(tokenId) returns (TokenDetails memory details) {
        return tokenDetails[tokenId];
    }

    /**
     * @notice Get collection statistics
     */
    function getCollectionStats()
        external
        view
        returns (CollectionStats memory stats)
    {
        return collectionStats;
    }

    /**
     * @notice Check if a request has already been processed
     */
    function isRequestProcessed(
        bytes32 requestId
    ) external view returns (bool processed) {
        return processedRequests[requestId];
    }

    /**
     * @notice Get the token ID for a processed request
     */
    function getTokenIdForRequest(
        bytes32 requestId
    ) external view returns (uint256 tokenId) {
        return requestToToken[requestId];
    }

    /**
     * @notice Get token details by original request ID
     */
    function getTokenByRequest(
        bytes32 requestId
    )
        external
        view
        returns (uint256 tokenId, address owner, string memory tokenURI_)
    {
        tokenId = requestToToken[requestId];
        if (tokenId > 0 && _ownerOf(tokenId) != address(0)) {
            owner = ownerOf(tokenId);
            tokenURI_ = tokenURI(tokenId);
        }
        return (tokenId, owner, tokenURI_);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Set ChainWeave contract address
     */
    function setChainWeaveContract(address newContract) external onlyOwner {
        require(newContract != address(0), "Invalid address");
        chainWeaveContract = newContract;
    }

    /**
     * @notice Set default royalty percentage
     */
    function setDefaultRoyalty(uint256 royalty) external onlyOwner {
        require(royalty <= MAX_ROYALTY, "Royalty too high");
        defaultRoyalty = royalty;
    }

    /**
     * @notice Set collection-level royalty info
     */
    function setCollectionRoyalty(
        address recipient,
        uint96 feeNumerator
    ) external onlyOwner {
        _setDefaultRoyalty(recipient, feeNumerator);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @notice Update collection statistics
     */
    function _updateCollectionStats(
        address user,
        bool isMint,
        uint256 salePrice
    ) internal {
        if (isMint) {
            collectionStats.totalSupply++;
            collectionStats.totalMinted++;

            // Track unique owners
            if (!isUniqueOwner[user]) {
                isUniqueOwner[user] = true;
                uniqueOwners.push(user);
                collectionStats.uniqueOwners++;
            }
        }

        if (salePrice > 0) {
            collectionStats.totalVolume += salePrice;

            // Update floor price (simplified logic)
            if (
                collectionStats.floorPrice == 0 ||
                salePrice < collectionStats.floorPrice
            ) {
                collectionStats.floorPrice = salePrice;
            }
        }

        emit CollectionStatsUpdated(
            collectionStats.totalSupply,
            collectionStats.uniqueOwners,
            collectionStats.totalVolume
        );
    }

    /**
     * @notice Override transfer to update token details
     */
    /**
     * @notice Override _update for OpenZeppelin v5 compatibility
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(ERC721, ERC721Enumerable)
        whenNotPaused
        returns (address)
    {
        address from = super._update(to, tokenId, auth);

        // Update token details on transfer (enterprise tracking)
        if (tokenId > 0 && to != address(0)) {
            tokenDetails[tokenId].owner = to;
        }

        return from;
    }

    /**
     * @notice Override _increaseBalance for OpenZeppelin v5 compatibility
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Handle cross-chain calls from ZetaChain via Gateway
     * @dev Enterprise-level function with comprehensive error handling and validation
     */
    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable returns (bytes memory) {
        require(msg.sender == address(gateway), "Only gateway can call");

        // Decode message from ChainWeave with enterprise validation
        (
            bytes32 requestId,
            address recipient,
            string memory tokenURI_,
            uint256 royalty
        ) = abi.decode(message, (bytes32, address, string, uint256));

        uint256 tokenId = 0;
        bool success = false;
        string memory errorMessage = "";

        // Enterprise-level try-catch with detailed error handling
        try
            this.mintFromChainWeaveInternal(
                requestId,
                recipient,
                tokenURI_,
                royalty
            )
        returns (uint256 _tokenId) {
            tokenId = _tokenId;
            success = true;
        } catch Error(string memory reason) {
            errorMessage = reason;
        } catch (bytes memory) {
            errorMessage = "Unknown minting error";
        }

        // Send enterprise-level response back to ChainWeave on ZetaChain
        bytes memory responseMessage = abi.encode(
            requestId,
            success,
            tokenId,
            errorMessage
        );

        // Use Gateway deposit and call pattern for response
        RevertOptions memory revertOptions = RevertOptions({
            revertAddress: address(this),
            callOnRevert: true,
            abortAddress: address(0),
            revertMessage: abi.encode(requestId, "Minting response failed"),
            onRevertGasLimit: 100000
        });

        gateway.depositAndCall{value: msg.value}(
            chainWeaveContract,
            responseMessage,
            revertOptions
        );

        // Return response for enterprise logging
        return responseMessage;
    }

    /**
     * @notice Internal minting function for try-catch handling
     */
    function mintFromChainWeaveInternal(
        bytes32 requestId,
        address recipient,
        string memory tokenURI_,
        uint256 royalty
    ) external returns (uint256) {
        require(msg.sender == address(this), "Only self");

        if (royalty > 0 && royalty <= MAX_ROYALTY) {
            return
                this.mintWithRoyalty(requestId, recipient, tokenURI_, royalty);
        } else {
            return this.mintFromChainWeave(requestId, recipient, tokenURI_);
        }
    }

    /**
     * @notice Handle cross-chain revert with enterprise-level error handling
     * @dev Maintains comprehensive revert processing and logging
     */
    function onRevert(RevertContext calldata revertContext) external {
        require(msg.sender == address(gateway), "Only gateway can call");

        bytes32 requestId;
        string memory errorReason;

        if (revertContext.revertMessage.length > 0) {
            try this.decodeRevertMessage(revertContext.revertMessage) returns (
                bytes32 _requestId,
                string memory _reason
            ) {
                requestId = _requestId;
                errorReason = _reason;
            } catch {
                errorReason = "Unknown revert reason";
            }
        }

        // Enterprise-level event emission with comprehensive data
        emit CrossChainMintReverted(
            requestId,
            errorReason,
            revertContext.sender
        );

        // Maintain request processing state for enterprise tracking
        if (requestId != bytes32(0)) {
            processedRequests[requestId] = false;
        }
    }

    /**
     * @notice Decode revert message for error handling
     */
    function decodeRevertMessage(
        bytes memory message
    ) external pure returns (bytes32 requestId, string memory reason) {
        (requestId, reason) = abi.decode(message, (bytes32, string));
    }

    /**
     * @notice Emitted when cross-chain minting is reverted
     */
    event CrossChainMintReverted(
        bytes32 indexed requestId,
        string reason,
        address sender
    );

    /**
     * @notice Burn token with enterprise-level stats tracking
     */
    function burn(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not authorized to burn"
        );

        // Update collection stats before burning
        collectionStats.totalSupply--;
        collectionStats.totalBurned++;

        // Clean up token details
        delete tokenDetails[tokenId];

        // Reset royalty info
        _resetTokenRoyalty(tokenId);

        // Call the base burn function
        _burn(tokenId);

        emit TokenBurned(tokenId, msg.sender);
    }

    event TokenBurned(uint256 indexed tokenId, address indexed burner);

    /**
     * @notice Override tokenURI to handle both URI storage methods
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Override supportsInterface for multiple inheritance
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Receive function for handling ETH payments
     */
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @notice Emitted when ETH is received by the contract
     */
    event PaymentReceived(address indexed sender, uint256 amount);
}
