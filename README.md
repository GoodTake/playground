# GoTake SDK

GoTake SDK is a TypeScript library for interacting with GoTake blockchain contracts. It provides a simple and easy-to-use API for working with Token Bound Accounts (TBA), Intellectual Property NFTs (IPNFT), and other features.

*[中文文档](https://www.npmjs.com/package/@gotake/gotake-sdk)*

## Installation

```bash
npm install gotake-sdk
```

## Usage

### Initializing the SDK

```typescript
import { GoTakeSDK } from 'gotake-sdk';

// Initialize with private key
const sdk = new GoTakeSDK({
    network: 'base_sepolia', // Network name
    provider: 'https://sepolia.base.org', // RPC URL or ethers.Provider instance
    signer: '0x123...', // Private key or ethers.Signer instance
});

// Initialize with browser wallet
if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const sdk = new GoTakeSDK({
        network: 'base_sepolia',
        provider: provider,
        signer: signer,
    });
}
```

### Working with IPNFT (Intellectual Property NFT)

```typescript
// Mint IPNFT
const tokenId = await sdk.ipnft.mint({
    to: '0x123...', // Recipient address
    uri: 'ipfs://...', // IPNFT metadata URI
    title: 'Patent Name',
    description: 'Patent Description',
    ipType: IPType.Patent // Intellectual property type
});

// Get IPNFT information
const info = await sdk.ipnft.getInfo(tokenId);
console.log(info);

// Get all IPNFTs owned by a user
const tokens = await sdk.ipnft.getTokensOfOwner('0x123...');
console.log(tokens);

// Get IPNFT total supply
const totalSupply = await sdk.ipnft.getTotalSupply();
console.log(totalSupply);

// Get IPNFT URI
const uri = await sdk.ipnft.getTokenURI(tokenId);
console.log(uri);

// Check if address owns IPNFT
const isOwner = await sdk.ipnft.isOwner(tokenId, '0x123...');
console.log(isOwner);

// Get number of IPNFTs owned by address
const balance = await sdk.ipnft.getBalance('0x123...');
console.log(balance);
```

### Working with TBA (Token Bound Account)

```typescript
// Create TBA account
const tbaAddress = await sdk.tba.create({
    tokenContract: '0x123...', // NFT contract address
    tokenId: 1, // NFT token ID
    salt: '0x0' // Optional salt
});

// Calculate TBA address
const address = await sdk.tba.getAddress({
    tokenContract: '0x123...',
    tokenId: 1
});

// Check if TBA exists
const exists = await sdk.tba.exists({
    tokenContract: '0x123...',
    tokenId: 1
});

// Get TBA owner
const owner = await sdk.tba.getOwner(tbaAddress);

// Get Token information associated with TBA
const tokenInfo = await sdk.tba.getTokenInfo(tbaAddress);

// Get TBA state
const state = await sdk.tba.getState(tbaAddress);

// Check if signer is valid
const isValid = await sdk.tba.isValidSigner(tbaAddress, '0x123...');
```

### Other Features

```typescript
// Get current network information
const networkInfo = await sdk.getNetworkInfo();

// Switch network
await sdk.switchNetwork('base_mainnet');

// Get account balance
const balance = await sdk.getBalance('0x123...');

// Get current account address
const address = await sdk.getAddress();
```

## Example Scripts Guide

This SDK provides several example scripts to help you understand how to use IPNFT and TBA functionality. These scripts are located in the `scripts` directory.

### Prerequisites

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create an environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to add your Ethereum private key:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

### Example Scripts

#### 1. Creating a TBA

The `create-tba.ts` script demonstrates:
- Creating an SDK instance
- Minting an IPNFT
- Creating a TBA linked to the IPNFT

Run with:
```bash
npx ts-node --transpile-only scripts/create-tba.ts
```

After successful execution, copy the TBA address to the `.env` file's `TBA_ADDRESS` field for use in subsequent scripts.

#### 2. Sending ETH to a TBA

The `send-eth-to-tba.ts` script demonstrates:
- Sending ETH to a TBA
- Executing transactions from the TBA (sending ETH back to the original account)

Run with:
```bash
npx ts-node --transpile-only scripts/send-eth-to-tba.ts
```

#### 3. Checking TBA Information

The `check-tba.ts` script demonstrates:
- Querying a TBA's balance
- Getting the Token information associated with a TBA
- Getting the TBA owner
- Getting detailed information about the associated IPNFT

Run with:
```bash
npx ts-node --transpile-only scripts/check-tba.ts
```

### Recommended Execution Order

1. First run `create-tba.ts` to create a TBA
2. Then run `check-tba.ts` to confirm the TBA was created successfully and check its information
3. Finally run `send-eth-to-tba.ts` to demonstrate interaction with the TBA

### Troubleshooting

If scripts fail, check:
1. Your private key is correct
2. Your account has sufficient test ETH
3. Network connection is stable
4. TBA address is correct (for second and third scripts)

## Supported Networks

- Base Sepolia (Testnet)
- Base Mainnet
- Other networks can be customized

## Contract ABI Updates

This SDK now depends on the `gotake-contracts` package to get the latest contract ABIs and TypeChain types. When contracts change, simply update this dependency to get the latest contract definitions.

### Updating Dependencies

When a new version of contracts is published, run the following commands to update dependencies:

```bash
yarn add gotake-contracts@latest
yarn build
```

### Using Contract Types

TypeChain-generated types can be imported directly from the contracts package:

```typescript
import { ERC6551Registry__factory, IPNFT__factory } from 'gotake-contracts';

// Use factory to create contract instance
const registry = ERC6551Registry__factory.connect(registryAddress, provider);
```

### Using Contract ABIs

Standardized ABIs can be imported directly:

```typescript
import { ERC6551REGISTRY_ABI, IPNFT_ABI } from 'gotake-contracts';

// Use ABI to create contract instance
const registry = new ethers.Contract(registryAddress, ERC6551REGISTRY_ABI, signer);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT License 