import React, { useState, useEffect } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { formatAddress, formatBalance } from '../lib/utils'
import { Wallet, Coins, Hash, RefreshCw } from 'lucide-react'

interface WalletInfoProps {
    sdk: GoTakeSDK
    address: string
    networkName: string
}

export function WalletInfo({ sdk, address, networkName }: WalletInfoProps) {
    const [balance, setBalance] = useState<string>('0')
    const [tbas, setTBAs] = useState<any[]>([])
    const [nfts, setNFTs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchWalletData = async () => {
        setLoading(true)
        try {
            // Fetch wallet balance
            const balanceWei = await sdk.provider.getBalance(address)
            setBalance((Number(balanceWei) / 1e18).toFixed(4))

            // Fetch TBAs (this would need to be implemented in the SDK)
            // For now, we'll use mock data
            setTBAs([])

            // Fetch NFTs (this would need to be implemented in the SDK)
            // For now, we'll use mock data
            setNFTs([])

        } catch (error) {
            console.error('Error fetching wallet data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWalletData()
    }, [sdk, address])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Wallet Overview */}
            <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-gray-500" />
                        <span>Wallet Overview</span>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchWalletData}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">Refresh</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Address</p>
                            <p className="font-mono text-sm break-all text-gray-900 dark:text-gray-100">{formatAddress(address, 10)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Network</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100">{networkName}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</p>
                            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{balance} ETH</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TBA Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">TBA Accounts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-mono">{tbas.length}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active TBAs</p>
                    </div>
                </CardContent>
            </Card>

            {/* NFT Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">NFTs</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-mono">{nfts.length}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Owned NFTs</p>
                    </div>
                </CardContent>
            </Card>

            {/* Tokens Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Tokens</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-mono">0</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">ERC-20 Tokens</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 