# FHEVM Hardhat Template

A FHEVM Hardhat-based template for developing Solidity smart contracts.

## Features

- **Fully Homomorphic Encryption (FHE)**: Secure operations on encrypted data
- **Counter Contract**: Encrypted state management with increment/decrement
- **Hardhat Development**: Full development environment with testing and deployment
- **Access Control**: Ownership and pausable functionality
- **Batch Operations**: Efficient batch increment operations

## Usage

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Deploy Contracts

```bash
npm run deploy
```

### Run Tests

```bash
npm test
```

## Configuration

The project uses Hardhat with FHEVM plugin for FHE operations. Configuration can be found in `hardhat.config.ts`.

### Key Configuration Files

- `hardhat.config.ts` - Main Hardhat configuration
- `tsconfig.json` - TypeScript compiler settings
- `.gitignore` - Git ignore patterns

## Security Features

- **Ownership Control**: Only owner can reset counter and transfer ownership
- **Pausable**: Contract can be paused by owner in emergency situations
- **Access Modifiers**: Proper use of modifiers for access control

For more information about how to use this template, please refer to the [FHEVM doc](https://docs.zama.ai/fhevm)
