// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
// import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
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
    ZetaInteractor,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using Counters for Counters.Counter;

    /// @notice Token ID counter
    Counters.Counter private _tokenIds;

    /// @notice ChainWeave contract address on ZetaChain
    address public chainWeaveContract;

    /// @notice ZetaChain connector contract
    ZetaInterfaces.ZetaConnector public connector;

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
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    /**
     * @notice Initialize the CrossChainMinter contract
     * @param connectorAddress Address of the ZetaChain connector
     * @param zetaTokenAddress Address of the ZETA token
     * @param _chainWeaveContract Address of ChainWeave contract on ZetaChain
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     */
    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address _chainWeaveContract,
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) ZetaInteractor(connectorAddress) {
        _setZetaToken(zetaTokenAddress);
        chainWeaveContract = _chainWeaveContract;
        connector = ZetaInterfaces.ZetaConnector(connectorAddress);

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
        string memory tokenURI
    ) external nonReentrant whenNotPaused returns (uint256 tokenId) {
        require(
            msg.sender == chainWeaveContract || msg.sender == address(this),
            "Only ChainWeave or internal"
        );
        require(recipient != address(0), "Invalid recipient");
        require(bytes(tokenURI).length > 0, "Empty token URI");
        require(!processedRequests[requestId], "Request already processed");

        // Mark request as processed
        processedRequests[requestId] = true;

        // Increment token ID and mint
        _tokenIds.increment();
        tokenId = _tokenIds.current();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Set default royalty for the token
        _setTokenRoyalty(tokenId, recipient, defaultRoyalty);

        // Store token details
        tokenDetails[tokenId] = TokenDetails({
            tokenId: tokenId,
            owner: recipient,
            tokenURI: tokenURI,
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
            tokenURI,
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
        string memory tokenURI,
        uint256 royalty
    ) external nonReentrant whenNotPaused returns (uint256 tokenId) {
        require(
            msg.sender == chainWeaveContract || msg.sender == address(this),
            "Only ChainWeave or internal"
        );
        require(recipient != address(0), "Invalid recipient");
        require(bytes(tokenURI).length > 0, "Empty token URI");
        require(royalty <= MAX_ROYALTY, "Royalty too high");
        require(!processedRequests[requestId], "Request already processed");

        // Mark request as processed
        processedRequests[requestId] = true;

        // Increment token ID and mint
        _tokenIds.increment();
        tokenId = _tokenIds.current();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Set custom royalty for the token
        _setTokenRoyalty(tokenId, recipient, royalty);

        // Store token details
        tokenDetails[tokenId] = TokenDetails({
            tokenId: tokenId,
            owner: recipient,
            tokenURI: tokenURI,
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
            tokenURI,
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

        _setTokenRoyalty(tokenId, ownerOf(tokenId), royalty);
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
            if (_exists(tokenIds[i])) {
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
        if (tokenId > 0 && _exists(tokenId)) {
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
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Update token details on transfer
        if (_exists(tokenId)) {
            tokenDetails[tokenId].owner = to;
        }
    }

    /**
     * @notice Handle cross-chain calls from ZetaChain
     */
    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        // Decode message from ChainWeave
        (
            bytes32 requestId,
            address recipient,
            string memory tokenURI_,
            uint256 royalty
        ) = abi.decode(
                zetaMessage.message,
                (bytes32, address, string, uint256)
            );

        uint256 tokenId = 0;
        bool success = false;
        string memory errorMessage = "";

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

        // Send response back to ChainWeave on ZetaChain
        bytes memory responseMessage = abi.encode(
            requestId,
            success,
            tokenId,
            errorMessage
        );

        // Send response via ZetaChain Gateway
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: abi.encodePacked(chainWeaveContract),
                destinationGasLimit: 300000,
                message: responseMessage,
                zetaValueAndGas: ZetaInterfaces.ZetaValueAndGas({zetaValue: 0}),
                zetaParams: abi.encode("")
            })
        );
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
            return mintWithRoyalty(requestId, recipient, tokenURI_, royalty);
        } else {
            return mintFromChainWeave(requestId, recipient, tokenURI_);
        }
    }

    /**
     * @notice Handle cross-chain revert
     */
    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        bytes32 requestId;
        string memory errorReason;

        if (zetaRevert.message.length > 0) {
            try this.decodeRevertMessage(zetaRevert.message) returns (
                bytes32 _requestId,
                string memory _reason
            ) {
                requestId = _requestId;
                errorReason = _reason;
            } catch {
                errorReason = "Unknown revert reason";
            }
        }

        emit CrossChainMintReverted(
            requestId,
            errorReason,
            zetaRevert.sourceChainId
        );

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
        uint256 sourceChainId
    );

    /**
     * @notice Override _burn to update stats
     */
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);

        // Update collection stats
        collectionStats.totalSupply--;
        collectionStats.totalBurned++;

        // Clean up token details
        delete tokenDetails[tokenId];

        // Reset royalty info
        _resetTokenRoyalty(tokenId);
    }

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
        override(ERC721, ERC721Enumerable, ERC2981, IERC165)
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
