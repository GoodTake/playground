import { useState } from 'react'
import { useGoTakeSDK } from '../hooks/useGoTakeSDK'
import { Navigation } from './Navigation'
import { WalletInfo } from './WalletInfo'
import { TBAManager } from './TBAManager'
import { VideoPurchaser } from './VideoPurchaser'
import { PermissionManager } from './PermissionManager'
import { ContentManager } from './ContentManager'

export function Dashboard() {
    const { sdk, loading, error, isReady, address, networkName } = useGoTakeSDK()
    const [activeItem, setActiveItem] = useState<string>('wallet')

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

    const renderContent = () => {
        switch (activeItem) {
            case 'wallet':
                return <WalletInfo sdk={sdk!} address={address!} networkName={networkName!} />
            case 'tba':
                return <TBAManager sdk={sdk!} />
            case 'video-purchase':
                return <VideoPurchaser sdk={sdk!} address={address || ''} />
            case 'permissions':
                return <PermissionManager sdk={sdk!} />
            case 'content-manager':
                return <ContentManager sdk={sdk!} />
            default:
                return <WalletInfo sdk={sdk!} address={address!} networkName={networkName!} />
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Left Navigation */}
            <Navigation
                activeItem={activeItem}
                onItemChange={setActiveItem}
            />

            {/* Main Content Area */}
            <div className="flex-1">
                <div className="p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
} 