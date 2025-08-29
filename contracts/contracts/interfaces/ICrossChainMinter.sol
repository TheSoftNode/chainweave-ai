// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title ICrossChainMinter
 * @notice Interface for cross-chain NFT minting contracts deployed on destination chains
 */
interface ICrossChainMinter {
    /// @notice Struct for collection statistics
    struct CollectionStats {
        uint256 totalSupply;
        uint256 totalMinted;
        uint256 totalBurned;
        uint256 uniqueOwners;
        uint256 totalVolume;
        uint256 floorPrice;
    }

    /// @notice Struct for token details with metadata
    struct TokenDetails {
        uint256 tokenId;
        address owner;
        string tokenURI;
        bytes32 requestId;
        uint256 mintTimestamp;
        uint256 royalty;
        bool exists;
    }

    /**
     * @notice Emitted when an NFT is minted on the destination chain
     */
    event CrossChainNFTMinted(
        bytes32 indexed requestId,
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI,
        uint256 royalty
    );

    /**
     * @notice Emitted when token metadata is updated
     */
    event MetadataUpdated(
        uint256 indexed tokenId,
        string oldURI,
        string newURI
    );

    /**
     * @notice Emitted when royalty is set for a token
     */
    event RoyaltySet(uint256 indexed tokenId, uint256 royalty);

    /**
     * @notice Emitted when tokens are transferred in batch
     */
    event BatchTransfer(
        address indexed from,
        address[] recipients,
        uint256[] tokenIds
    );

    /**
     * @notice Mint an NFT from a cross-chain request
     * @param requestId Original request identifier
     * @param recipient Address to receive the NFT
     * @param tokenURI Metadata URI for the NFT
     * @return tokenId The minted token ID
     */
    function mintFromChainWeave(
        bytes32 requestId,
        address recipient,
        string memory tokenURI
    ) external returns (uint256 tokenId);

    /**
     * @notice Mint an NFT with royalty settings
     * @param requestId Original request identifier
     * @param recipient Address to receive the NFT
     * @param tokenURI Metadata URI for the NFT
     * @param royalty Royalty percentage (basis points, max 1000 = 10%)
     * @return tokenId The minted token ID
     */
    function mintWithRoyalty(
        bytes32 requestId,
        address recipient,
        string memory tokenURI,
        uint256 royalty
    ) external returns (uint256 tokenId);

    /**
     * @notice Update token metadata (owner or authorized only)
     * @param tokenId Token to update
     * @param newURI New metadata URI
     */
    function updateTokenMetadata(
        uint256 tokenId,
        string memory newURI
    ) external;

    /**
     * @notice Set royalty for a token (owner only)
     * @param tokenId Token ID
     * @param royalty Royalty percentage in basis points
     */
    function setRoyalty(uint256 tokenId, uint256 royalty) external;

    /**
     * @notice Transfer multiple tokens to different recipients
     * @param recipients Array of recipient addresses
     * @param tokenIds Array of token IDs to transfer
     */
    function transferBatch(
        address[] memory recipients,
        uint256[] memory tokenIds
    ) external;

    /**
     * @notice Get tokens owned by an address with pagination
     * @param owner The owner address
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return tokenIds Array of token IDs
     * @return tokenDetails Array of token details
     */
    function getTokensByOwnerPaginated(
        address owner,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (uint256[] memory tokenIds, TokenDetails[] memory tokenDetails);

    /**
     * @notice Get metadata for multiple tokens
     * @param tokenIds Array of token IDs
     * @return tokenURIs Array of metadata URIs
     * @return owners Array of token owners
     */
    function getTokenMetadataBatch(
        uint256[] memory tokenIds
    )
        external
        view
        returns (string[] memory tokenURIs, address[] memory owners);

    /**
     * @notice Get detailed token information
     * @param tokenId Token ID to query
     * @return details Complete token details
     */
    function getTokenDetails(
        uint256 tokenId
    ) external view returns (TokenDetails memory details);

    /**
     * @notice Get collection statistics
     * @return stats Collection-wide statistics
     */
    function getCollectionStats()
        external
        view
        returns (CollectionStats memory stats);

    /**
     * @notice Check if a request has already been processed
     * @param requestId The request identifier
     * @return processed True if already processed
     */
    function isRequestProcessed(
        bytes32 requestId
    ) external view returns (bool processed);

    /**
     * @notice Get the token ID for a processed request
     * @param requestId The request identifier
     * @return tokenId The token ID (0 if not processed)
     */
    function getTokenIdForRequest(
        bytes32 requestId
    ) external view returns (uint256 tokenId);

    /**
     * @notice Get token details by original request ID
     * @param requestId The original request ID
     * @return tokenId Token ID
     * @return owner Token owner
     * @return tokenURI Metadata URI
     */
    function getTokenByRequest(
        bytes32 requestId
    )
        external
        view
        returns (uint256 tokenId, address owner, string memory tokenURI);
}
