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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">Initializing SDK...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="font-medium text-red-600 dark:text-red-400">Failed to initialize SDK</p>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400 font-mono">{error}</p>
                </div>
            </div>
        )
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">Please connect your wallet to continue</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex space-x-1 rounded border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
                <Button
                    variant={activeTab === 'wallet' ? 'default' : 'ghost'}
                    size="default"
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 text-sm font-medium transition-all duration-200 ${activeTab === 'wallet'
                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    Wallet Info
                </Button>
                <Button
                    variant={activeTab === 'tba' ? 'default' : 'ghost'}
                    size="default"
                    onClick={() => setActiveTab('tba')}
                    className={`flex-1 text-sm font-medium transition-all duration-200 ${activeTab === 'tba'
                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    TBA Manager
                </Button>
                <Button
                    variant={activeTab === 'mint' ? 'default' : 'ghost'}
                    size="default"
                    onClick={() => setActiveTab('mint')}
                    className={`flex-1 text-sm font-medium transition-all duration-200 ${activeTab === 'mint'
                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                        }`}
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