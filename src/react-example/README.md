# GoTake SDK React Example

A modern React application demonstrating the integration of GoTake SDK with wallet connectivity using Rainbow Kit.

## Features

- 🔗 **Wallet Connection**: Connect multiple wallets using Rainbow Kit
- 📊 **Dashboard**: View wallet information, TBAs, NFTs, and tokens
- 🏦 **TBA Management**: Create and manage Token Bound Accounts with different salt values
- 🎨 **NFT Minting**: Mint Intellectual Property NFTs (IPNFTs) with metadata
- 🔐 **Secure**: Uses wallet signatures instead of private keys

## Prerequisites

- Node.js 18+ 
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Test ETH on Base Sepolia network

## Setup

1. **Install dependencies**:
   ```bash
   cd src/react-example
   npm install
   ```

2. **Configure WalletConnect** (Optional):
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Update `src/lib/wagmi-config.ts` with your project ID

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## Usage

### 1. Connect Wallet
- Click "Connect Wallet" button
- Choose your preferred wallet
- Approve the connection

### 2. Dashboard
- View your wallet address, balance, and network
- See summary of TBAs, NFTs, and tokens

### 3. TBA Management
- Create new TBAs with custom salt values
- View existing TBAs and their properties
- Check TBA balances and signer status

### 4. Mint NFTs
- Fill in NFT metadata (title, description, tags)
- Click "Mint NFT" to create an IPNFT
- Track minting progress and view transaction

## Supported Networks

- Base Sepolia (Testnet) - Recommended for testing
- Base Mainnet
- Ethereum Mainnet
- Ethereum Sepolia

## Architecture

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Header.tsx      # App header
│   ├── WalletConnection.tsx
│   ├── WalletInfo.tsx
│   ├── TBAManager.tsx
│   └── NFTMinter.tsx
├── hooks/              # Custom React hooks
│   └── useGoTakeSDK.ts # SDK integration hook
├── lib/                # Utility libraries
│   ├── utils.ts        # Helper functions
│   └── wagmi-config.ts # Wallet configuration
├── styles/             # CSS styles
│   └── globals.css     # Global styles
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## Key Components

### useGoTakeSDK Hook
Manages SDK initialization with wallet signer:
- Automatically detects network changes
- Creates ethers signer from wagmi wallet client
- Handles SDK lifecycle and errors

### Dashboard
Main interface with tabbed navigation:
- Wallet Info: Shows balance, address, network
- TBA Manager: Create and manage TBAs
- NFT Minter: Mint new IPNFTs

### TBA Manager
- Create TBAs with different salt values
- View TBA properties and balances
- Check signer permissions

### NFT Minter
- Form-based NFT creation
- Real-time minting status
- Transaction tracking

## Security Notes

- Never hardcode private keys
- Uses wallet signatures for all transactions
- All sensitive operations require user approval
- Network switching handled automatically

## Troubleshooting

### Common Issues

1. **Wallet not connecting**:
   - Ensure wallet extension is installed
   - Check if wallet is unlocked
   - Try refreshing the page

2. **Transaction failures**:
   - Check wallet has sufficient ETH for gas
   - Verify you're on the correct network
   - Ensure wallet is connected

3. **SDK initialization errors**:
   - Check network connectivity
   - Verify wallet is properly connected
   - Check browser console for detailed errors

### Getting Test ETH

For Base Sepolia testing:
- Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
- Connect your wallet and request test ETH

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. Create new components in `src/components/`
2. Add custom hooks in `src/hooks/`
3. Update types in `src/types/`
4. Follow existing patterns for consistency

## License

This example is provided for educational purposes. See the main project license for details. 