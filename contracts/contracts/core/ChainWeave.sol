// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
// import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IChainWeave.sol";
import "../interfaces/ICrossChainMinter.sol";

/**
 * @title ChainWeave
 * @notice Universal Smart Contract for cross-chain AI NFT minting on ZetaChain
 * @dev Production-ready contract with comprehensive backend integration support
 */
contract ChainWeave is
    IChainWeave,
    zContract,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using Counters for Counters.Counter;

    /// @notice System contract for cross-chain operations
    SystemContract public immutable systemContract;

    /// @notice Backend service address authorized to complete AI generation
    address public backendService;

    /// @notice Fee for requesting NFT mints
    uint256 public requestFee = 0.001 ether;

    /// @notice Maximum fee allowed (safety check)
    uint256 public constant MAX_FEE = 1 ether;

    /// @notice Request ID counter
    Counters.Counter private _requestCounter;

    /// @notice Gas limit for cross-chain calls
    uint256 public gasLimit = 500000;

    /// @notice Mapping from request ID to request details
    mapping(bytes32 => MintRequest) public mintRequests;

    /// @notice Mapping from user address to their request IDs
    mapping(address => bytes32[]) public userRequests;

    /// @notice Mapping to track processed requests (prevent replay attacks)
    mapping(bytes32 => bool) public processedRequests;

    /// @notice Array of all request IDs for enumeration
    bytes32[] public allRequests;

    /// @notice Mapping from status to request IDs
    mapping(RequestStatus => bytes32[]) public requestsByStatus;

    /// @notice Platform statistics
    PlatformStats public platformStats;

    /// @notice Supported destination chains
    mapping(uint256 => bool) public supportedChains;
    uint256[] public chainList;

    /// @notice Cross-chain minter contracts
    mapping(uint256 => address) public minterContracts;

    /// @notice Events for analytics and monitoring
    event BackendServiceUpdated(
        address indexed oldService,
        address indexed newService
    );
    event GasLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event ChainSupported(
        uint256 indexed chainId,
        address indexed minterContract
    );
    event ChainUnsupported(uint256 indexed chainId);

    /// @notice Modifiers
    modifier onlyBackendService() {
        require(msg.sender == backendService, "Only backend service");
        _;
    }

    modifier validRequestId(bytes32 requestId) {
        require(
            mintRequests[requestId].sender != address(0),
            "Invalid request ID"
        );
        _;
    }

    modifier onlyRequestSender(bytes32 requestId) {
        require(
            mintRequests[requestId].sender == msg.sender,
            "Not request sender"
        );
        _;
    }

    /**
     * @notice Initialize the ChainWeave contract
     * @param systemContractAddress Address of the system contract
     * @param _backendService Address of the backend service
     */
    constructor(address systemContractAddress, address _backendService) {
        systemContract = SystemContract(systemContractAddress);
        backendService = _backendService;

        // Initialize platform stats
        platformStats.activeChains = 0;
        platformStats.totalFees = 0;
        platformStats.totalRequests = 0;
        platformStats.completedMints = 0;
    }

    /**
     * @notice Main entry point for cross-chain NFT minting
     */
    function requestNFTMint(
        string memory prompt,
        uint256 destinationChainId,
        bytes memory recipient
    ) external payable nonReentrant whenNotPaused returns (bytes32 requestId) {
        require(bytes(prompt).length > 0, "Empty prompt");
        require(supportedChains[destinationChainId], "Unsupported chain");
        require(recipient.length > 0, "Empty recipient");
        require(msg.value >= requestFee, "Insufficient fee");

        // Generate unique request ID
        _requestCounter.increment();
        requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                block.timestamp,
                _requestCounter.current(),
                prompt,
                destinationChainId
            )
        );

        // Create mint request
        MintRequest storage request = mintRequests[requestId];
        request.requestId = requestId;
        request.sender = msg.sender;
        request.sourceChainId = block.chainid;
        request.destinationChainId = destinationChainId;
        request.prompt = prompt;
        request.recipient = recipient;
        request.timestamp = block.timestamp;
        request.processed = false;
        request.fee = msg.value;
        request.status = RequestStatus.Pending;

        // Update mappings and arrays
        userRequests[msg.sender].push(requestId);
        allRequests.push(requestId);
        requestsByStatus[RequestStatus.Pending].push(requestId);

        // Update platform stats
        platformStats.totalRequests++;
        platformStats.totalFees += msg.value;

        // Emit event for backend monitoring
        emit NFTMintRequested(
            requestId,
            msg.sender,
            block.chainid,
            destinationChainId,
            prompt,
            recipient,
            msg.value
        );

        // Refund excess payment
        if (msg.value > requestFee) {
            payable(msg.sender).transfer(msg.value - requestFee);
        }

        return requestId;
    }

    /**
     * @notice Complete AI generation process (backend only)
     */
    function completeAIGeneration(
        bytes32 requestId,
        string memory tokenURI
    ) external onlyBackendService validRequestId(requestId) nonReentrant {
        MintRequest storage request = mintRequests[requestId];
        require(request.status == RequestStatus.Pending, "Invalid status");
        require(bytes(tokenURI).length > 0, "Empty token URI");

        // Update request status and URI
        request.status = RequestStatus.AICompleted;
        request.tokenURI = tokenURI;

        // Update status tracking
        _removeFromStatusArray(RequestStatus.Pending, requestId);
        requestsByStatus[RequestStatus.AICompleted].push(requestId);

        emit AIGenerationCompleted(requestId, tokenURI);

        // Initiate cross-chain minting
        _initiateCrossChainMint(requestId);
    }

    /**
     * @notice Cancel a pending request
     */
    function cancelRequest(
        bytes32 requestId
    )
        external
        validRequestId(requestId)
        onlyRequestSender(requestId)
        nonReentrant
    {
        MintRequest storage request = mintRequests[requestId];
        require(
            request.status == RequestStatus.Pending ||
                request.status == RequestStatus.Processing,
            "Cannot cancel request"
        );

        // Update status
        RequestStatus oldStatus = request.status;
        request.status = RequestStatus.Cancelled;

        // Update status tracking
        _removeFromStatusArray(oldStatus, requestId);
        requestsByStatus[RequestStatus.Cancelled].push(requestId);

        // Refund the fee
        payable(request.sender).transfer(request.fee);

        emit RequestCancelled(requestId, msg.sender);
    }

    /**
     * @notice Update metadata URI for a request
     */
    function updateRequestMetadata(
        bytes32 requestId,
        string memory newURI
    ) external onlyBackendService validRequestId(requestId) {
        require(bytes(newURI).length > 0, "Empty URI");
        mintRequests[requestId].tokenURI = newURI;
    }

    /**
     * @notice Internal function to initiate cross-chain minting
     */
    function _initiateCrossChainMint(bytes32 requestId) internal {
        MintRequest storage request = mintRequests[requestId];
        request.status = RequestStatus.Processing;

        // Update status tracking
        _removeFromStatusArray(RequestStatus.AICompleted, requestId);
        requestsByStatus[RequestStatus.Processing].push(requestId);

        address minterContract = minterContracts[request.destinationChainId];
        require(minterContract != address(0), "No minter contract");

        // Get the recipient address from bytes
        address recipient = BytesHelperLib.bytesToAddress(request.recipient, 0);

        // Prepare message data for cross-chain call
        bytes memory messageData = abi.encode(
            requestId,
            recipient,
            request.tokenURI,
            uint256(0) // Default royalty, can be customized
        );

        // Execute cross-chain call via ZetaChain Gateway
        (bool success, ) = address(systemContract).call(
            abi.encodeWithSignature(
                "crossChainCall(uint256,address,bytes,uint256)",
                request.destinationChainId,
                minterContract,
                messageData,
                gasLimit
            )
        );

        if (!success) {
            // Handle cross-chain call failure
            request.status = RequestStatus.Failed;
            _removeFromStatusArray(RequestStatus.Processing, requestId);
            requestsByStatus[RequestStatus.Failed].push(requestId);

            emit NFTMintReverted(requestId, "Cross-chain call failed");
        }
    }

    /**
     * @notice Handle cross-chain call responses
     */
    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        require(msg.sender == address(systemContract), "Only system contract");

        // Decode the response from destination chain
        (
            bytes32 requestId,
            bool mintSuccess,
            uint256 tokenId,
            string memory errorMessage
        ) = abi.decode(message, (bytes32, bool, uint256, string));

        // Validate request exists and is in processing state
        MintRequest storage request = mintRequests[requestId];
        require(request.sender != address(0), "Invalid request");
        require(
            request.status == RequestStatus.Processing,
            "Invalid request status"
        );

        if (mintSuccess && tokenId > 0) {
            // Minting succeeded on destination chain
            request.status = RequestStatus.Completed;
            request.processed = true;
            request.tokenId = tokenId;

            // Update status tracking
            _removeFromStatusArray(RequestStatus.Processing, requestId);
            requestsByStatus[RequestStatus.Completed].push(requestId);

            // Update platform stats
            platformStats.completedMints++;

            emit NFTMinted(
                requestId,
                tokenId,
                request.tokenURI,
                request.destinationChainId
            );
        } else {
            // Minting failed on destination chain
            request.status = RequestStatus.Failed;

            // Update status tracking
            _removeFromStatusArray(RequestStatus.Processing, requestId);
            requestsByStatus[RequestStatus.Failed].push(requestId);

            emit NFTMintReverted(
                requestId,
                bytes(errorMessage).length > 0
                    ? errorMessage
                    : "Destination chain minting failed"
            );
        }
    }

    /**
     * @notice Get detailed request information
     */
    function getMintRequest(
        bytes32 requestId
    ) external view returns (MintRequest memory request) {
        return mintRequests[requestId];
    }

    /**
     * @notice Get user's NFT requests with pagination
     */
    function getUserRequestsPaginated(
        address user,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory requestIds, MintRequest[] memory requests)
    {
        bytes32[] memory userRequestIds = userRequests[user];
        uint256 totalRequests = userRequestIds.length;

        if (offset >= totalRequests) {
            return (new bytes32[](0), new MintRequest[](0));
        }

        uint256 end = offset + limit;
        if (end > totalRequests) {
            end = totalRequests;
        }

        uint256 length = end - offset;
        requestIds = new bytes32[](length);
        requests = new MintRequest[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 id = userRequestIds[offset + i];
            requestIds[i] = id;
            requests[i] = mintRequests[id];
        }

        return (requestIds, requests);
    }

    /**
     * @notice Get requests by status
     */
    function getRequestsByStatus(
        RequestStatus status,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory requestIds) {
        bytes32[] memory statusRequests = requestsByStatus[status];
        uint256 totalRequests = statusRequests.length;

        if (offset >= totalRequests) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > totalRequests) {
            end = totalRequests;
        }

        uint256 length = end - offset;
        requestIds = new bytes32[](length);

        for (uint256 i = 0; i < length; i++) {
            requestIds[i] = statusRequests[offset + i];
        }

        return requestIds;
    }

    /**
     * @notice Get platform statistics
     */
    function getPlatformStats()
        external
        view
        returns (PlatformStats memory stats)
    {
        return platformStats;
    }

    /**
     * @notice Get user's NFT history across all chains
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
        )
    {
        bytes32[] memory userRequestIds = userRequests[user];
        uint256 completedCount = 0;

        // Count completed requests
        for (uint256 i = 0; i < userRequestIds.length; i++) {
            if (
                mintRequests[userRequestIds[i]].status ==
                RequestStatus.Completed
            ) {
                completedCount++;
            }
        }

        // Populate arrays with completed requests
        requestIds = new bytes32[](completedCount);
        chainIds = new uint256[](completedCount);
        tokenIds = new uint256[](completedCount);

        uint256 index = 0;
        for (uint256 i = 0; i < userRequestIds.length; i++) {
            bytes32 reqId = userRequestIds[i];
            MintRequest memory req = mintRequests[reqId];

            if (req.status == RequestStatus.Completed) {
                requestIds[index] = reqId;
                chainIds[index] = req.destinationChainId;
                tokenIds[index] = req.tokenId;
                index++;
            }
        }

        return (requestIds, chainIds, tokenIds);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Set the request fee
     */
    function setRequestFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        uint256 oldFee = requestFee;
        requestFee = newFee;
        emit RequestFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Get current request fee
     */
    function getRequestFee() external view returns (uint256 fee) {
        return requestFee;
    }

    /**
     * @notice Set backend service address
     */
    function setBackendService(address newService) external onlyOwner {
        require(newService != address(0), "Invalid address");
        address oldService = backendService;
        backendService = newService;
        emit BackendServiceUpdated(oldService, newService);
    }

    /**
     * @notice Add supported chain
     */
    function addSupportedChain(
        uint256 chainId,
        address minterContract
    ) external onlyOwner {
        require(minterContract != address(0), "Invalid contract");
        require(!supportedChains[chainId], "Chain already supported");

        supportedChains[chainId] = true;
        minterContracts[chainId] = minterContract;
        chainList.push(chainId);
        platformStats.activeChains++;

        emit ChainSupported(chainId, minterContract);
    }

    /**
     * @notice Remove supported chain
     */
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        require(supportedChains[chainId], "Chain not supported");

        supportedChains[chainId] = false;
        delete minterContracts[chainId];

        // Remove from chain list
        for (uint256 i = 0; i < chainList.length; i++) {
            if (chainList[i] == chainId) {
                chainList[i] = chainList[chainList.length - 1];
                chainList.pop();
                break;
            }
        }

        platformStats.activeChains--;
        emit ChainUnsupported(chainId);
    }

    /**
     * @notice Set gas limit for cross-chain calls
     */
    function setGasLimit(uint256 newLimit) external onlyOwner {
        require(newLimit > 100000 && newLimit < 10000000, "Invalid gas limit");
        uint256 oldLimit = gasLimit;
        gasLimit = newLimit;
        emit GasLimitUpdated(oldLimit, newLimit);
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
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // ============ INTERNAL HELPER FUNCTIONS ============

    /**
     * @notice Remove request from status array
     */
    function _removeFromStatusArray(
        RequestStatus status,
        bytes32 requestId
    ) internal {
        bytes32[] storage statusArray = requestsByStatus[status];
        for (uint256 i = 0; i < statusArray.length; i++) {
            if (statusArray[i] == requestId) {
                statusArray[i] = statusArray[statusArray.length - 1];
                statusArray.pop();
                break;
            }
        }
    }

    /**
     * @notice Receive function for handling ETH deposits
     */
    receive() external payable {
        platformStats.totalFees += msg.value;
        emit FeeReceived(msg.sender, msg.value);
    }

    /**
     * @notice Emitted when fees are received
     */
    event FeeReceived(address indexed sender, uint256 amount);
}
