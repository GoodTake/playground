import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import {
    Search,
    ShoppingCart,
    Loader2,
    Check,
    X,
    Info,
    ArrowLeft,
    Eye,
    Clock
} from 'lucide-react'
import { ethers } from 'ethers'
import { useVideoPurchase } from '../hooks/useVideoPurchase'

interface VideoPurchaserProps {
    sdk: GoTakeSDK
    address: string
}

export function VideoPurchaser({ sdk, address }: VideoPurchaserProps) {
    const {
        // State
        step,
        contentId,
        contentInfo,
        selectedPaymentMethod,
        selectedTokenAddress,
        loading,
        error,
        txHash,
        approveHash,
        currentOperation,

        // Actions
        setContentId,
        queryContent,
        selectPaymentMethod,
        purchase,
        reset,
        clearError,
        goBackToInput,
    } = useVideoPurchase(sdk)

    return (
        <div className="space-y-6 max-w-4xl mx-auto overflow-hidden">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Video Content Purchase</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Purchase access to video content with flexible payment options</p>
            </div>

            {/* Progress Indicator */}
            {step !== 'input' && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${step === 'info' || step === 'processing' || step === 'complete' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${step === 'info' || step === 'processing' || step === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                {step === 'info' || step === 'processing' || step === 'complete' ? '✓' : '1'}
                            </div>
                            <span className="ml-2 text-sm font-medium">Content Info</span>
                        </div>
                        <div className={`flex items-center ${step === 'processing' || step === 'complete' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${step === 'processing' || step === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                {step === 'processing' || step === 'complete' ? '✓' : '2'}
                            </div>
                            <span className="ml-2 text-sm font-medium">
                                {selectedPaymentMethod === 'ERC20' ? 'Approval & Purchase' : 'Purchase'}
                            </span>
                        </div>
                        <div className={`flex items-center ${step === 'complete' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${step === 'complete' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                                {step === 'complete' ? '✓' : '3'}
                            </div>
                            <span className="ml-2 text-sm font-medium">Complete</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Content ID Input */}
            {step === 'input' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Find Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content ID
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter content ID to purchase"
                                value={contentId}
                                onChange={(e) => setContentId(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={queryContent}
                            disabled={!contentId || loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search Content
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Content Information Display */}
            {step === 'info' && contentInfo && (
                <div className="space-y-6">
                    {/* Back to Search Button */}
                    <div>
                        <Button
                            onClick={goBackToInput}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Search
                        </Button>
                    </div>

                    {/* Content Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Content Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Content ID
                                    </label>
                                    <p className="text-gray-900 dark:text-gray-100">{contentInfo.contentId}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <p className="text-green-600 dark:text-green-400">Active</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        View Count
                                    </label>
                                    <p className="text-gray-900 dark:text-gray-100">{contentInfo.viewCount} views</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Access Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Your Access Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contentInfo.userHasAccess ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span className="font-medium text-green-700 dark:text-green-300">
                                            You have access to this content
                                        </span>
                                    </div>

                                    {contentInfo.remainingViews !== undefined && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Remaining Views
                                                </label>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {contentInfo.remainingViews} views
                                                </p>
                                            </div>

                                            {contentInfo.purchaseTime && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Purchase Date
                                                    </label>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {contentInfo.purchaseTime.toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {contentInfo.isExpired && (
                                        <div className="flex items-center gap-2 mt-3">
                                            <Clock className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm text-orange-600 dark:text-orange-400">
                                                Access has expired
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <X className="h-5 w-5 text-red-500" />
                                    <span className="font-medium text-red-700 dark:text-red-300">
                                        You don't have access to this content
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Options - Only show if user doesn't have access or access expired */}
                    {(!contentInfo.userHasAccess || contentInfo.isExpired) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Purchase Access
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Payment Options */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Select Payment Method
                                    </label>
                                    <div className="space-y-3">
                                        {/* ETH Payment Option */}
                                        {ethers.constants.AddressZero in contentInfo.rawTokenPrices && (
                                            <div
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === 'ETH'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                    : 'border-gray-300 dark:border-gray-700'
                                                    }`}
                                                onClick={() => selectPaymentMethod('ETH')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">Pay with ETH</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Native Ethereum payment</p>
                                                    </div>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                        {contentInfo.nativePrice} ETH
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Token Payment Options */}
                                        {Object.entries(contentInfo.tokenPrices)
                                            .filter(([address]) => address !== ethers.constants.AddressZero)
                                            .map(([address, price]) => (
                                                <div
                                                    key={address}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === 'ERC20' && selectedTokenAddress === address
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                        : 'border-gray-300 dark:border-gray-700'
                                                        }`}
                                                    onClick={() => selectPaymentMethod('ERC20', address)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-gray-100">Pay with Token</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {address.slice(0, 10)}...{address.slice(-8)}
                                                            </p>
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {price}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <Button onClick={purchase} className="w-full" disabled={!selectedPaymentMethod}>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Purchase Access
                                    {selectedPaymentMethod === 'ETH' && ethers.constants.AddressZero in contentInfo.rawTokenPrices &&
                                        ` - ${contentInfo.nativePrice} ETH`
                                    }
                                    {selectedPaymentMethod === 'ERC20' && selectedTokenAddress &&
                                        ` - ${contentInfo.tokenPrices[selectedTokenAddress]}`
                                    }
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {currentOperation === 'approve' ? 'Processing Token Approval' : 'Processing Purchase'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {currentOperation === 'approve'
                                    ? 'Please wait while we process your token approval...'
                                    : 'Please wait while we process your purchase...'}
                            </p>
                            {(txHash || approveHash) && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 break-all">
                                        Tx: {currentOperation === 'approve' ? approveHash : txHash}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Purchase Complete */}
            {step === 'complete' && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Purchase Successful!</p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                You now have access to content {contentInfo?.contentId}
                            </p>

                            {(txHash || approveHash) && (
                                <div className="mt-4 space-y-3">
                                    {approveHash && (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Token Approval Transaction:
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
                                                {approveHash}
                                            </p>
                                        </div>
                                    )}
                                    {txHash && (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Purchase Transaction:
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
                                                {txHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button onClick={reset} className="mt-4">
                                Purchase Another Content
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-full">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start min-w-0 flex-1">
                            <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                                    {currentOperation === 'approve' ? 'Token Approval Failed' : 'Purchase Failed'}
                                </p>
                                <div className="text-sm text-red-700 dark:text-red-300 break-words overflow-hidden">
                                    {error.length > 200 ? (
                                        <details className="cursor-pointer">
                                            <summary className="font-medium">
                                                {error.includes('gas') ? 'Gas estimation failed' :
                                                    error.includes('allowance') ? 'Token allowance insufficient' :
                                                        error.includes('approve') ? 'Token approval failed' :
                                                            'Transaction failed'}
                                            </summary>
                                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs font-mono max-h-32 overflow-y-auto">
                                                {error}
                                            </div>
                                        </details>
                                    ) : (
                                        <p>{error}</p>
                                    )}
                                </div>
                                {currentOperation === 'approve' ? (
                                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                        <p>• Make sure you have enough tokens for the approval</p>
                                        <p>• Check that you're connected to the correct network</p>
                                        <p>• Ensure your wallet has sufficient ETH for gas fees</p>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                        <p>• Make sure you have enough ETH for gas fees</p>
                                        <p>• Check that you're connected to the correct network</p>
                                        <p>• Verify your wallet has sufficient token balance</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 ml-2"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Connected Wallet Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Connected Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Address: </span>
                        <span className="text-gray-900 dark:text-gray-100">
                            {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : 'Not connected'}
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
} 