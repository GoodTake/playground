import { NetworkId, getNetworkById, getNetworkContractAddresses } from '@gotake/gotake-sdk'

// Get all network IDs that have contract deployments
export function getSupportedNetworkIds(): number[] {
    const supportedIds: number[] = []

    Object.values(NetworkId).forEach(value => {
        if (typeof value === 'number') {
            const contracts = getNetworkContractAddresses(value)
            // Check if network has at least one contract deployed
            if (contracts && Object.values(contracts).some(address => address !== undefined)) {
                supportedIds.push(value)
            }
        }
    })

    return supportedIds
}

// Get network information by chain ID
export function getNetworkInfo(chainId: number) {
    try {
        return getNetworkById(chainId)
    } catch (error) {
        console.warn(`Network ${chainId} not found in SDK:`, error)
        return null
    }
}

// Get contract addresses for a specific network
export function getContractAddresses(chainId: number) {
    try {
        return getNetworkContractAddresses(chainId)
    } catch (error) {
        console.warn(`Contract addresses for network ${chainId} not found:`, error)
        return null
    }
}

// Generate block explorer URL for transaction
export function getBlockExplorerUrl(chainId: number, txHash: string): string {
    const networkInfo = getNetworkInfo(chainId)
    if (networkInfo?.blockExplorer) {
        return `${networkInfo.blockExplorer}/tx/${txHash}`
    }

    throw new Error(`Block explorer URL not available for network ${chainId}`)
}

// Check if network is supported by SDK
export function isNetworkSupported(chainId: number): boolean {
    const contracts = getContractAddresses(chainId)
    return contracts !== null && Object.values(contracts).some(address => address !== undefined)
}

// Get default contract address for current network
export function getDefaultContractAddress(chainId: number, contractName: keyof ReturnType<typeof getNetworkContractAddresses>): string {
    const contracts = getContractAddresses(chainId)
    return contracts?.[contractName] || ''
} 