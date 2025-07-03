import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatAddress(address: string, length = 6): string {
    if (!address) return ""
    return `${address.slice(0, length)}...${address.slice(-4)}`
}

export function formatBalance(balance: string | number, decimals = 4): string {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance
    return num.toFixed(decimals)
}

export function formatTokenId(tokenId: string | number): string {
    const id = tokenId.toString()
    if (id.length <= 8) return id
    return `${id.slice(0, 4)}...${id.slice(-4)}`
}

export function formatTokenSymbol(symbol: string): string {
    if (!symbol) return 'tokens'
    return symbol.length > 10 ? `${symbol.slice(0, 10)}...` : symbol
}

export function formatTokenPrice(price: string, symbol?: string): string {
    const formattedSymbol = formatTokenSymbol(symbol || 'tokens')
    return `${price} ${formattedSymbol}`
} 