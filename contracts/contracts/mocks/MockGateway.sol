// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/Revert.sol";

/**
 * @title MockGateway
 * @notice Mock Gateway contract for testing
 */
contract MockGateway is IGatewayZEVM {
    event MockCall(
        bytes receiver,
        address zrc20,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );

    event MockWithdraw(
        bytes receiver,
        uint256 amount,
        uint256 chainId,
        RevertOptions revertOptions
    );

    // Store the ChainWeave contract for callbacks
    address public chainWeaveContract;

    function setChainWeaveContract(address _chainWeave) external {
        chainWeaveContract = _chainWeave;
    }

    // Helper function for testing - allows simulation of callbacks
    function simulateCallback(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external {
        require(chainWeaveContract != address(0), "ChainWeave not set");

        // Call back to ChainWeave
        (bool success, ) = chainWeaveContract.call(
            abi.encodeWithSignature(
                "onCall((bytes,address,uint256),address,uint256,bytes)",
                context,
                zrc20,
                amount,
                message
            )
        );
        require(success, "Callback failed");
    }

    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external override {
        emit MockCall(receiver, zrc20, message, callOptions, revertOptions);
        // Simple mock - just emit the event, don't do callbacks
    }

    function withdraw(
        bytes memory receiver,
        uint256 amount,
        uint256 chainId,
        RevertOptions calldata revertOptions
    ) external override {
        emit MockWithdraw(receiver, amount, chainId, revertOptions);
    }

    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions calldata revertOptions
    ) external override {
        // Mock implementation for ZRC20 withdraw
    }

    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external override {
        // Mock implementation
    }

    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        uint256 chainId,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    ) external override {
        // Mock implementation
    }

    function deposit(
        address zrc20,
        uint256 amount,
        address target
    ) external override {
        // Mock implementation
    }

    function execute(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        address target,
        bytes calldata message
    ) external override {
        // Mock implementation
    }

    function depositAndCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        address target,
        bytes calldata message
    ) external override {
        // Mock implementation
    }

    function depositAndCall(
        MessageContext calldata context,
        uint256 amount,
        address target,
        bytes calldata message
    ) external override {
        // Mock implementation
    }

    function depositAndRevert(
        address zrc20,
        uint256 amount,
        address target,
        RevertContext calldata revertContext
    ) external override {
        // Mock implementation
    }

    function executeRevert(
        address target,
        RevertContext calldata revertContext
    ) external override {
        // Mock implementation
    }
}
