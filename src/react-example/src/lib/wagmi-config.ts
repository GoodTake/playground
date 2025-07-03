import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { Chain } from 'viem'
import { getSupportedNetworkIds, getNetworkInfo } from './network-utils'

// Get supported chains from SDK
function getSupportedChains(): readonly [Chain, ...Chain[]] {
    const supportedNetworkIds = getSupportedNetworkIds()
    const chains: Chain[] = []

    for (const networkId of supportedNetworkIds) {
        const networkInfo = getNetworkInfo(networkId)

        if (networkInfo) {
            const chain: Chain = {
                id: networkInfo.id,
                name: networkInfo.name,
                nativeCurrency: {
                    name: networkInfo.nativeCurrency.name,
                    symbol: networkInfo.nativeCurrency.symbol,
                    decimals: networkInfo.nativeCurrency.decimals,
                },
                rpcUrls: {
                    default: {
                        http: [networkInfo.rpcUrl]
                    }
                },
                blockExplorers: {
                    default: {
                        name: 'Explorer',
                        url: networkInfo.blockExplorer
                    }
                }
            }

            chains.push(chain)
        }
    }

    if (chains.length === 0) {
        throw new Error('No supported networks found in GoTake SDK')
    }

    return [chains[0], ...chains.slice(1)] as const
}

export const config = getDefaultConfig({
    appName: 'GoTake SDK React Example',
    projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
    chains: getSupportedChains(),
    ssr: false,
}) 