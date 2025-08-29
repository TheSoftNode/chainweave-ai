// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/evm/interfaces/IGatewayEVM.sol";
import "@zetachain/protocol-contracts/contracts/Revert.sol";

/**
 * @title MockGatewayEVM
 * @notice Mock Gateway EVM contract for testing CrossChainMinter
 */
contract MockGatewayEVM is IGatewayEVM {
    event MockExecute(address destination, bytes data);
    event MockDeposit(address receiver, uint256 amount, address asset);

    function execute(
        MessageContext calldata messageContext,
        address destination,
        bytes calldata data
    ) external payable override returns (bytes memory) {
        emit MockExecute(destination, data);
        return data;
    }

    function executeWithERC20(
        MessageContext calldata messageContext,
        address token,
        address to,
        uint256 amount,
        bytes calldata data
    ) external override {
        // Mock implementation
    }

    function executeRevert(
        address destination,
        bytes calldata data,
        RevertContext calldata revertContext
    ) external payable override {
        // Mock implementation
    }

    function revertWithERC20(
        address token,
        address to,
        uint256 amount,
        bytes calldata data,
        RevertContext calldata revertContext
    ) external override {
        // Mock implementation
    }

    function deposit(
        address receiver,
        RevertOptions calldata revertOptions
    ) external payable override {
        emit MockDeposit(receiver, msg.value, address(0));
    }

    function deposit(
        address receiver,
        uint256 amount,
        address asset,
        RevertOptions calldata revertOptions
    ) external override {
        emit MockDeposit(receiver, amount, asset);
    }

    function depositAndCall(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external payable override {
        // Mock implementation
    }

    function depositAndCall(
        address receiver,
        uint256 amount,
        address asset,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external override {
        // Mock implementation
    }

    function call(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external override {
        // Mock implementation
    }
}
