import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia, base, mainnet, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
    appName: 'GoTake SDK React Example',
    projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
    chains: [baseSepolia, base, mainnet, sepolia],
    ssr: false,
}) 