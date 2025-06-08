import React, { useState } from 'react'
import { useGoTakeSDK } from '../hooks/useGoTakeSDK'
import { WalletInfo } from './WalletInfo'
import { TBAManager } from './TBAManager'
import { NFTMinter } from './NFTMinter'
import { Button } from './ui/Button'

export function Dashboard() {
    const { sdk, loading, error, isReady, address, networkName } = useGoTakeSDK()
    const [activeTab, setActiveTab] = useState<'wallet' | 'tba' | 'mint'>('wallet')

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Initializing SDK...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-destructive">
                    <p className="font-medium">Failed to initialize SDK</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            </div>
        )
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p>Please connect your wallet to continue</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
                <Button
                    variant={activeTab === 'wallet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('wallet')}
                    className="flex-1"
                >
                    Wallet Info
                </Button>
                <Button
                    variant={activeTab === 'tba' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('tba')}
                    className="flex-1"
                >
                    TBA Manager
                </Button>
                <Button
                    variant={activeTab === 'mint' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('mint')}
                    className="flex-1"
                >
                    Mint NFT
                </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'wallet' && (
                <WalletInfo
                    sdk={sdk!}
                    address={address!}
                    networkName={networkName}
                />
            )}
            {activeTab === 'tba' && (
                <TBAManager sdk={sdk!} />
            )}
            {activeTab === 'mint' && (
                <NFTMinter sdk={sdk!} address={address!} />
            )}
        </div>
    )
} 