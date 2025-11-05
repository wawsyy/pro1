// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
/// @author fhevm-hardhat-template
/// @notice A basic example contract showing how to work with encrypted data
/// @dev Version 1.0.0
contract FHECounter is SepoliaConfig {
    string public constant VERSION = "1.0.0";
    
    euint32 private _count;
    address private _owner;
    bool private _paused;

    event CounterIncremented(address indexed user);
    event CounterDecremented(address indexed user);
    event CounterReset(address indexed user);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == _owner, "FHECounter: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "FHECounter: contract is paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "FHECounter: contract is not paused");
        _;
    }

    constructor() {
        _owner = msg.sender;
        _paused = false;
    }

    /// @notice Returns the current count
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice Increments the counter by a specified encrypted value.
    /// @param inputEuint32 the encrypted input value
    /// @param inputProof the input proof
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external whenNotPaused {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);
        euint32 newCount = FHE.add(_count, encryptedEuint32);
        _count = newCount;

        FHE.allowThis(newCount);
        FHE.allow(newCount, msg.sender);
        
        emit CounterIncremented(msg.sender);
    }

    /// @notice Decrements the counter by a specified encrypted value.
    /// @param inputEuint32 the encrypted input value
    /// @param inputProof the input proof
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external whenNotPaused {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);
        euint32 newCount = FHE.sub(_count, encryptedEuint32);
        _count = newCount;

        FHE.allowThis(newCount);
        FHE.allow(newCount, msg.sender);
        
        emit CounterDecremented(msg.sender);
    }

    /// @notice Resets the counter to zero
    function reset() external onlyOwner {
        _count = FHE.asEuint32(0);
        
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
        
        emit CounterReset(msg.sender);
    }

    /// @notice Returns the owner address
    function owner() external view returns (address) {
        return _owner;
    }

    /// @notice Pauses the contract
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses the contract
    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Returns whether the contract is paused
    function paused() external view returns (bool) {
        return _paused;
    }

    /// @notice Batch increment operation
    /// @param inputEuint32 the encrypted input value
    /// @param inputProof the input proof
    /// @param times number of times to increment
    /// @dev Useful for multiple increments with the same value
    function batchIncrement(externalEuint32 inputEuint32, bytes calldata inputProof, uint8 times) external whenNotPaused {
        require(times > 0 && times <= 10, "FHECounter: times must be between 1 and 10");
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);
        
        euint32 result = _count;
        for (uint8 i = 0; i < times; i++) {
            result = FHE.add(result, encryptedEuint32);
        }
        _count = result;

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        emit CounterIncremented(msg.sender);
    }
}
