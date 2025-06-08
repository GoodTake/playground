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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Wallet Overview */}
            <Card className="col-span-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5" />
                        <span>Wallet Overview</span>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchWalletData}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <p className="font-mono text-sm break-all">{formatAddress(address, 10)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Network</p>
                            <p className="text-sm">{networkName}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Balance</p>
                            <p className="text-sm">{balance} ETH</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TBA Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Hash className="h-5 w-5" />
                        <span>TBA Accounts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{tbas.length}</div>
                        <p className="text-sm text-muted-foreground">Active TBAs</p>
                    </div>
                </CardContent>
            </Card>

            {/* NFT Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-5 w-5" />
                        <span>NFTs</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{nfts.length}</div>
                        <p className="text-sm text-muted-foreground">Owned NFTs</p>
                    </div>
                </CardContent>
            </Card>

            {/* Tokens Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-5 w-5" />
                        <span>Tokens</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">ERC-20 Tokens</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 