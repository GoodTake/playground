import { ethers } from 'ethers'

// Token metadata interface
export interface TokenInfo {
    address: string
    decimals: number
    symbol?: string
    name?: string
}

// Cache for token decimals to avoid repeated contract calls
const tokenDecimalsCache = new Map<string, number>()

// Common token presets (addresses will vary by network)
const COMMON_TOKENS: Record<string, Partial<TokenInfo>> = {
    // Ethereum Mainnet
    '0xA0b86a33E6441644CCA3E31e0c3E2eA22e518E7C': { decimals: 6, symbol: 'USDC', name: 'USD Coin' }, // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': { decimals: 6, symbol: 'USDT', name: 'Tether USD' }, // USDT
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': { decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin' }, // DAI
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': { decimals: 8, symbol: 'WBTC', name: 'Wrapped BTC' }, // WBTC

    // Polygon
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { decimals: 6, symbol: 'USDC', name: 'USD Coin' }, // USDC on Polygon
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': { decimals: 6, symbol: 'USDT', name: 'Tether USD' }, // USDT on Polygon

    // Arbitrum
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': { decimals: 6, symbol: 'USDC', name: 'USD Coin' }, // USDC on Arbitrum
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': { decimals: 6, symbol: 'USDT', name: 'Tether USD' }, // USDT on Arbitrum
}

// Standard ERC20 ABI for decimals and symbol
const ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
]

/**
 * Get token decimals from contract, with caching
 */
export async function getTokenDecimals(
    tokenAddress: string,
    provider: ethers.providers.Provider
): Promise<number> {
    // Check if it's ETH (AddressZero)
    if (tokenAddress === ethers.constants.AddressZero) {
        return 18
    }

    // Normalize address
    const normalizedAddress = tokenAddress.toLowerCase()

    // Check cache first
    if (tokenDecimalsCache.has(normalizedAddress)) {
        return tokenDecimalsCache.get(normalizedAddress)!
    }

    // Check common token presets
    if (COMMON_TOKENS[tokenAddress]?.decimals !== undefined) {
        const decimals = COMMON_TOKENS[tokenAddress].decimals!
        tokenDecimalsCache.set(normalizedAddress, decimals)
        return decimals
    }

    try {
        // Query contract for decimals
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        const decimals = await contract.decimals()
        const decimalsNumber = typeof decimals === 'number' ? decimals : decimals.toNumber()

        // Cache the result
        tokenDecimalsCache.set(normalizedAddress, decimalsNumber)
        return decimalsNumber
    } catch (error) {
        console.warn(`Failed to get decimals for token ${tokenAddress}:`, error)
        // Fallback to 18 decimals
        const fallbackDecimals = 18
        tokenDecimalsCache.set(normalizedAddress, fallbackDecimals)
        return fallbackDecimals
    }
}

/**
 * Get token info (decimals, symbol, name) with caching
 */
export async function getTokenInfo(
    tokenAddress: string,
    provider: ethers.providers.Provider
): Promise<TokenInfo> {
    // Handle ETH case
    if (tokenAddress === ethers.constants.AddressZero) {
        return {
            address: tokenAddress,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum'
        }
    }

    const decimals = await getTokenDecimals(tokenAddress, provider)

    // Check for preset info
    const preset = COMMON_TOKENS[tokenAddress]
    if (preset) {
        return {
            address: tokenAddress,
            decimals,
            symbol: preset.symbol,
            name: preset.name
        }
    }

    // Try to get symbol and name from contract
    try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

        const [symbol, name] = await Promise.allSettled([
            contract.symbol(),
            contract.name()
        ])

        return {
            address: tokenAddress,
            decimals,
            symbol: symbol.status === 'fulfilled' ? symbol.value : undefined,
            name: name.status === 'fulfilled' ? name.value : undefined
        }
    } catch (error) {
        console.warn(`Failed to get token info for ${tokenAddress}:`, error)
        return {
            address: tokenAddress,
            decimals
        }
    }
}

/**
 * Smart format token amount with correct decimals
 */
export async function formatTokenAmount(
    amount: ethers.BigNumber | string,
    tokenAddress: string,
    provider: ethers.providers.Provider,
    maxDecimals = 6
): Promise<string> {
    const decimals = await getTokenDecimals(tokenAddress, provider)

    try {
        const formattedAmount = ethers.utils.formatUnits(amount, decimals)
        const numericAmount = parseFloat(formattedAmount)

        // Format with appropriate decimal places
        if (numericAmount === 0) {
            return '0'
        } else if (numericAmount < 0.000001) {
            return '< 0.000001'
        } else if (numericAmount < 1) {
            return numericAmount.toFixed(6)
        } else if (numericAmount < 1000) {
            return numericAmount.toFixed(Math.min(maxDecimals, 4))
        } else {
            return numericAmount.toFixed(Math.min(maxDecimals, 2))
        }
    } catch (error) {
        console.warn(`Failed to format token amount for ${tokenAddress}:`, error)
        // Fallback to formatEther
        return ethers.utils.formatEther(amount)
    }
}

/**
 * Format token amount with symbol
 */
export async function formatTokenAmountWithSymbol(
    amount: ethers.BigNumber | string,
    tokenAddress: string,
    provider: ethers.providers.Provider,
    maxDecimals = 6
): Promise<string> {
    const [formattedAmount, tokenInfo] = await Promise.all([
        formatTokenAmount(amount, tokenAddress, provider, maxDecimals),
        getTokenInfo(tokenAddress, provider)
    ])

    const symbol = tokenInfo.symbol || 'tokens'
    return `${formattedAmount} ${symbol}`
}

/**
 * Batch format multiple token amounts
 */
export async function batchFormatTokenAmounts(
    tokenPrices: Record<string, ethers.BigNumber | string>,
    provider: ethers.providers.Provider,
    maxDecimals = 6
): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    // Process all tokens in parallel
    const formatPromises = Object.entries(tokenPrices).map(async ([address, amount]) => {
        const formatted = await formatTokenAmount(amount, address, provider, maxDecimals)
        return [address, formatted] as [string, string]
    })

    const formattedResults = await Promise.allSettled(formatPromises)

    formattedResults.forEach((result, index) => {
        const [address] = Object.entries(tokenPrices)[index]
        if (result.status === 'fulfilled') {
            results[address] = result.value[1]
        } else {
            console.warn(`Failed to format token ${address}:`, result.reason)
            // Fallback to formatEther
            results[address] = ethers.utils.formatEther(tokenPrices[address])
        }
    })

    return results
}

/**
 * Parse token amount with correct decimals
 */
export async function parseTokenAmount(
    amount: string,
    tokenAddress: string,
    provider: ethers.providers.Provider
): Promise<ethers.BigNumber> {
    const decimals = await getTokenDecimals(tokenAddress, provider)
    return ethers.utils.parseUnits(amount, decimals)
}

/**
 * Batch format multiple token amounts with symbols
 */
export async function batchFormatTokenAmountsWithSymbol(
    tokenPrices: Record<string, ethers.BigNumber | string>,
    provider: ethers.providers.Provider,
    maxDecimals = 6
): Promise<Record<string, string>> {
    const results: Record<string, string> = {}

    // Process all tokens in parallel
    const formatPromises = Object.entries(tokenPrices).map(async ([address, amount]) => {
        const formatted = await formatTokenAmountWithSymbol(amount, address, provider, maxDecimals)
        return [address, formatted] as [string, string]
    })

    const formattedResults = await Promise.allSettled(formatPromises)

    formattedResults.forEach((result, index) => {
        const [address] = Object.entries(tokenPrices)[index]
        if (result.status === 'fulfilled') {
            results[address] = result.value[1]
        } else {
            console.warn(`Failed to format token ${address}:`, result.reason)
            // Fallback to formatEther
            results[address] = ethers.utils.formatEther(tokenPrices[address])
        }
    })

    return results
}

/**
 * Clear token cache (useful for testing or network changes)
 */
export function clearTokenCache(): void {
    tokenDecimalsCache.clear()
} 