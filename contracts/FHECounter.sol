// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
/// @author fhevm-hardhat-template
/// @notice A basic example contract showing how to work with encrypted data
contract FHECounter is SepoliaConfig {
    euint32 private _count;
    address private _owner;

    event CounterIncremented(address indexed user);
    event CounterDecremented(address indexed user);
    event CounterReset(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == _owner, "FHECounter: caller is not the owner");
        _;
    }

    constructor() {
        _owner = msg.sender;
    }

    /// @notice Returns the current count
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice Increments the counter by a specified encrypted value.
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        _count = FHE.add(_count, encryptedEuint32);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
        
        emit CounterIncremented(msg.sender);
    }

    /// @notice Decrements the counter by a specified encrypted value.
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        _count = FHE.sub(_count, encryptedEuint32);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
        
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
}
