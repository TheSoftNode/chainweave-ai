// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title IChainWeave
 * @notice Interface for the ChainWeave Universal Smart Contract
 * @dev Defines the core functionality for cross-chain AI NFT minting
 */
interface IChainWeave {
    /// @notice Enum for request status tracking
    enum RequestStatus {
        Pending,
        Processing,
        AICompleted,
        Completed,
        Failed,
        Reverted,
        Cancelled
    }

    /// @notice Struct to store detailed mint request data
    struct MintRequest {
        bytes32 requestId;
        address sender;
        uint256 sourceChainId;
        uint256 destinationChainId;
        string prompt;
        bytes recipient;
        uint256 timestamp;
        bool processed;
        uint256 tokenId;
        string tokenURI;
        uint256 fee;
        RequestStatus status;
    }

    /// @notice Struct for platform statistics
    struct PlatformStats {
        uint256 totalRequests;
        uint256 completedMints;
        uint256 totalFees;
        uint256 activeChains;
    }

    /**
     * @notice Emitted when an NFT mint request is initiated
     */
    event NFTMintRequested(
        bytes32 indexed requestId,
        address indexed sender,
        uint256 indexed sourceChainId,
        uint256 destinationChainId,
        string prompt,
        bytes recipient,
        uint256 fee
    );

    /**
     * @notice Emitted when AI generation is completed
     */
    event AIGenerationCompleted(bytes32 indexed requestId, string tokenURI);

    /**
     * @notice Emitted when an NFT is successfully minted
     */
    event NFTMinted(
        bytes32 indexed requestId,
        uint256 indexed tokenId,
        string tokenURI,
        uint256 destinationChainId
    );

    /**
     * @notice Emitted when a mint request is cancelled
     */
    event RequestCancelled(bytes32 indexed requestId, address sender);

    /**
     * @notice Emitted when request fee is updated
     */
    event RequestFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Emitted when a mint request fails and is reverted
     */
    event NFTMintReverted(bytes32 indexed requestId, string reason);

    /**
     * @notice Main entry point for cross-chain NFT minting
     * @param prompt AI prompt to generate NFT content
     * @param destinationChainId Target chain for NFT minting
     * @param recipient Address to receive the minted NFT
     * @return requestId Unique identifier for tracking the request
     */
    function requestNFTMint(
        string memory prompt,
        uint256 destinationChainId,
        bytes memory recipient
    ) external payable returns (bytes32 requestId);

    /**
     * @notice Complete AI generation process (backend only)
     * @param requestId The request identifier
     * @param tokenURI Generated metadata URI from AI + IPFS
     */
    function completeAIGeneration(
        bytes32 requestId,
        string memory tokenURI
    ) external;

    /**
     * @notice Cancel a pending request
     * @param requestId The request to cancel
     */
    function cancelRequest(bytes32 requestId) external;

    /**
     * @notice Update metadata URI for a request
     * @param requestId The request identifier
     * @param newURI New metadata URI
     */
    function updateRequestMetadata(
        bytes32 requestId,
        string memory newURI
    ) external;

    /**
     * @notice Get the status of an NFT mint request
     * @param requestId The request identifier
     * @return request Full request details
     */
    function getMintRequest(
        bytes32 requestId
    ) external view returns (MintRequest memory request);

    /**
     * @notice Get user's NFT requests with pagination
     * @param user User address
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return requestIds Array of request IDs
     * @return requests Array of request details
     */
    function getUserRequestsPaginated(
        address user,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory requestIds, MintRequest[] memory requests);

    /**
     * @notice Get requests by status
     * @param status The status to filter by
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return requestIds Array of matching request IDs
     */
    function getRequestsByStatus(
        RequestStatus status,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory requestIds);

    /**
     * @notice Get platform statistics
     * @return stats Platform-wide statistics
     */
    function getPlatformStats()
        external
        view
        returns (PlatformStats memory stats);

    /**
     * @notice Set the request fee (owner only)
     * @param newFee New fee amount in wei
     */
    function setRequestFee(uint256 newFee) external;

    /**
     * @notice Get current request fee
     * @return fee Current fee in wei
     */
    function getRequestFee() external view returns (uint256 fee);

    /**
     * @notice Get user's NFT history across all chains
     * @param user User address
     * @return requestIds Array of request IDs associated with the user
     * @return chainIds Array of chain IDs where NFTs were minted
     * @return tokenIds Array of token IDs
     */
    function getUserNFTHistory(
        address user
    )
        external
        view
        returns (
            bytes32[] memory requestIds,
            uint256[] memory chainIds,
            uint256[] memory tokenIds
        );
}
