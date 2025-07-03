import { useState } from 'react'
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
import { batchFormatTokenAmountsWithSymbol } from '../lib/token-utils'

interface VideoPurchaserProps {
    sdk: GoTakeSDK
    address: string
}

interface ContentInfo {
    contentId: number
    isActive: boolean
    defaultViewCount: number
    viewDuration: number
    nativePrice: string
    tokenPrices: Record<string, string>
    userHasAccess: boolean
    remainingViews?: number
    purchaseTime?: Date
    isExpired?: boolean
}

interface PurchaseFlow {
    step: 'input' | 'info' | 'approve' | 'processing' | 'complete'
    contentId: string
    contentInfo: ContentInfo | null
    selectedPaymentMethod: 'ETH' | 'ERC20'
    selectedTokenAddress?: string
    needsApproval?: boolean
    approveStatus?: 'idle' | 'processing' | 'complete' | 'error'
}

interface OperationStatus {
    loading: boolean
    success: boolean
    error: string | null
    txHash?: string
    approveHash?: string
    operation?: 'approve' | 'purchase'
}

export function VideoPurchaser({ sdk, address }: VideoPurchaserProps) {
    // Purchase flow state
    const [purchaseFlow, setPurchaseFlow] = useState<PurchaseFlow>({
        step: 'input',
        contentId: '',
        contentInfo: null,
        selectedPaymentMethod: 'ETH'
    })

    // Operation status
    const [status, setStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Query content information
    const queryContentInfo = async () => {
        if (!purchaseFlow.contentId.trim()) {
            setStatus({
                loading: false,
                success: false,
                error: 'Please enter a valid content ID'
            })
            return
        }

        setStatus({ loading: true, success: false, error: null })

        try {
            const contentId = parseInt(purchaseFlow.contentId)
            if (isNaN(contentId)) {
                throw new Error('Please provide a valid content ID')
            }

            const rawInfo = await sdk.videoPayment.getContentInfo(contentId)

            if (!rawInfo.isActive) {
                throw new Error('This content is not available for purchase')
            }

            // Check if user already has access
            const hasAccess = await sdk.videoPayment.hasViewPermission(contentId)

            let remainingViews = 0
            let purchaseTime: Date | undefined
            let isExpired = true

            if (hasAccess) {
                try {
                    const permissions = await sdk.videoPayment.getMyPermissions(contentId)
                    remainingViews = permissions.remainingViews.toNumber()
                    purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000)
                    isExpired = !permissions.isValid
                } catch (error) {
                    // If getMyPermissions fails, just set default values
                    remainingViews = 0
                    isExpired = true
                }
            }

            // Format token prices with correct decimals and symbols
            const formattedTokenPrices = await batchFormatTokenAmountsWithSymbol(
                rawInfo.tokenPrices || {},
                sdk.provider
            )

            const contentInfo: ContentInfo = {
                contentId,
                isActive: rawInfo.isActive,
                defaultViewCount: rawInfo.defaultViewCount,
                viewDuration: rawInfo.viewDuration,
                nativePrice: ethers.utils.formatEther(rawInfo.nativePrice),
                tokenPrices: formattedTokenPrices,
                userHasAccess: hasAccess,
                remainingViews,
                purchaseTime,
                isExpired
            }

            setPurchaseFlow(prev => ({
                ...prev,
                contentInfo,
                step: 'info'
            }))

            setStatus({ loading: false, success: true, error: null })

        } catch (error) {
            setStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to query content information'
            })
        }
    }

    // Select payment method
    const selectPaymentMethod = (method: 'ETH' | 'ERC20', tokenAddress?: string) => {
        setPurchaseFlow(prev => ({
            ...prev,
            selectedPaymentMethod: method,
            selectedTokenAddress: tokenAddress
        }))
    }

    // Get ERC20 token contract instance
    const getTokenContract = (tokenAddress: string) => {
        const tokenABI = [
            'function allowance(address owner, address spender) external view returns (uint256)',
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function balanceOf(address account) external view returns (uint256)',
            'function decimals() external view returns (uint8)'
        ]
        return new ethers.Contract(tokenAddress, tokenABI, sdk.signer)
    }

    // Try to get contract address from transaction error
    const extractContractAddressFromError = (error: any): string | null => {
        try {
            const errorString = error.toString()
            // Look for contract address patterns in error messages
            const addressMatch = errorString.match(/0x[a-fA-F0-9]{40}/)
            return addressMatch ? addressMatch[0] : null
        } catch {
            return null
        }
    }

    // Check current token allowance - removed unused function

    // Execute token approval
    const executeTokenApprove = async (spenderAddress: string, tokenAddress: string, amount: string) => {
        try {
            const tokenContract = getTokenContract(tokenAddress)
            const amountWei = ethers.utils.parseEther(amount)

            // Request approval for the exact amount needed
            const approveTx = await tokenContract.approve(spenderAddress, amountWei)
            return approveTx
        } catch (error) {
            throw error
        }
    }

    // Execute purchase with selected payment method
    const executePurchase = async () => {
        if (!purchaseFlow.contentInfo) return

        setStatus({ loading: true, success: false, error: null, operation: 'purchase' })
        setPurchaseFlow(prev => ({ ...prev, step: 'processing' }))

        try {
            const { contentId } = purchaseFlow.contentInfo
            let result: any

            if (purchaseFlow.selectedPaymentMethod === 'ETH') {
                // Purchase with ETH using SDK
                result = await sdk.videoPayment.purchaseContent(contentId, 'ETH')
            } else {
                // Purchase with ERC20 token using SDK
                if (!purchaseFlow.selectedTokenAddress) {
                    throw new Error('Token address not selected')
                }

                const tokenAddress = purchaseFlow.selectedTokenAddress
                const requiredAmount = purchaseFlow.contentInfo.tokenPrices[tokenAddress]

                // For ERC20 tokens, automatically do approval first then purchase
                try {
                    // Set approve operation status
                    setStatus(prev => ({ ...prev, operation: 'approve' }))

                    // Get contract address through a test purchase call
                    let spenderAddress: string | null = null
                    try {
                        await sdk.videoPayment.purchaseContent(contentId, 'ERC20', tokenAddress)
                        // If purchase succeeds, we already had approval
                        result = await sdk.videoPayment.purchaseContent(contentId, 'ERC20', tokenAddress)
                    } catch (purchaseError: any) {
                        // Purchase failed - extract contract address and do approval
                        spenderAddress = extractContractAddressFromError(purchaseError)

                        if (!spenderAddress) {
                            // Can't get contract address, use a simplified error
                            throw new Error('Token approval required but contract address could not be determined. Please try again or contact support.')
                        }

                        // Execute approval automatically
                        const approveTx = await executeTokenApprove(spenderAddress, tokenAddress, requiredAmount)

                        setStatus(prev => ({
                            ...prev,
                            approveHash: approveTx.hash
                        }))

                        // Wait for approval to be mined
                        await approveTx.wait()

                        // Now try purchase again
                        setStatus(prev => ({ ...prev, operation: 'purchase' }))
                        result = await sdk.videoPayment.purchaseContent(contentId, 'ERC20', tokenAddress)
                    }

                } catch (error: any) {
                    // Simplify error messages for better display
                    let errorMessage = error.message || 'Transaction failed'
                    if (errorMessage.length > 150) {
                        if (errorMessage.includes('gas')) {
                            errorMessage = 'Gas estimation failed. Please check your network connection and ETH balance.'
                        } else if (errorMessage.includes('allowance') || errorMessage.includes('approve')) {
                            errorMessage = 'Token approval failed. Please try again.'
                        } else {
                            errorMessage = 'Transaction failed. Please check your network and balance.'
                        }
                    }
                    throw new Error(errorMessage)
                }
            }

            setStatus({
                loading: false,
                success: true,
                error: null,
                txHash: result.transactionHash,
                operation: 'purchase'
            })

            setPurchaseFlow(prev => ({ ...prev, step: 'complete' }))

        } catch (error) {
            setStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Purchase failed',
                operation: 'purchase'
            })
            setPurchaseFlow(prev => ({ ...prev, step: 'info' }))
        }
    }

    // Reset purchase flow
    const resetFlow = () => {
        setPurchaseFlow({
            step: 'input',
            contentId: '',
            contentInfo: null,
            selectedPaymentMethod: 'ETH',
            needsApproval: false,
            approveStatus: 'idle'
        })
        setStatus({
            loading: false,
            success: false,
            error: null,
            txHash: undefined,
            approveHash: undefined,
            operation: undefined
        })
    }

    // Format duration display
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto overflow-hidden">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Video Content Purchase</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Purchase access to video content with flexible payment options</p>
            </div>

            {/* Progress Indicator */}
            {purchaseFlow.step !== 'input' && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${purchaseFlow.step === 'info' || purchaseFlow.step === 'approve' || purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${purchaseFlow.step === 'info' || purchaseFlow.step === 'approve' || purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                {purchaseFlow.step === 'info' || purchaseFlow.step === 'approve' || purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? '✓' : '1'}
                            </div>
                            <span className="ml-2 text-sm font-medium">Content Info</span>
                        </div>
                        <div className={`flex items-center ${purchaseFlow.step === 'approve' && purchaseFlow.selectedPaymentMethod === 'ERC20' ? 'text-blue-600 dark:text-blue-400' : purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : (purchaseFlow.step === 'approve' && purchaseFlow.selectedPaymentMethod === 'ERC20') ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                {purchaseFlow.step === 'processing' || purchaseFlow.step === 'complete' ? '✓' : '2'}
                            </div>
                            <span className="ml-2 text-sm font-medium">
                                {purchaseFlow.selectedPaymentMethod === 'ERC20' ? 'Approval & Purchase' : 'Purchase'}
                            </span>
                        </div>
                        <div className={`flex items-center ${purchaseFlow.step === 'complete' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${purchaseFlow.step === 'complete' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                                {purchaseFlow.step === 'complete' ? '✓' : '3'}
                            </div>
                            <span className="ml-2 text-sm font-medium">Complete</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Content ID Input */}
            {purchaseFlow.step === 'input' && (
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
                                value={purchaseFlow.contentId}
                                onChange={(e) => setPurchaseFlow(prev => ({ ...prev, contentId: e.target.value }))}
                            />
                        </div>

                        <Button
                            onClick={queryContentInfo}
                            disabled={!purchaseFlow.contentId || status.loading}
                            className="w-full"
                        >
                            {status.loading ? (
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
            {purchaseFlow.step === 'info' && purchaseFlow.contentInfo && (
                <div className="space-y-6">
                    {/* Back to Search Button */}
                    <div>
                        <Button
                            onClick={() => setPurchaseFlow(prev => ({ ...prev, step: 'input', contentInfo: null }))}
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
                                    <p className="text-gray-900 dark:text-gray-100">{purchaseFlow.contentInfo.contentId}</p>
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
                                    <p className="text-gray-900 dark:text-gray-100">{purchaseFlow.contentInfo.defaultViewCount} views</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Duration
                                    </label>
                                    <p className="text-gray-900 dark:text-gray-100">{formatDuration(purchaseFlow.contentInfo.viewDuration)}</p>
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
                            {purchaseFlow.contentInfo.userHasAccess ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span className="font-medium text-green-700 dark:text-green-300">
                                            You have access to this content
                                        </span>
                                    </div>

                                    {purchaseFlow.contentInfo.remainingViews !== undefined && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Remaining Views
                                                </label>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {purchaseFlow.contentInfo.remainingViews} views
                                                </p>
                                            </div>

                                            {purchaseFlow.contentInfo.purchaseTime && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Purchase Date
                                                    </label>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {purchaseFlow.contentInfo.purchaseTime.toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {purchaseFlow.contentInfo.isExpired && (
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
                    {(!purchaseFlow.contentInfo.userHasAccess || purchaseFlow.contentInfo.isExpired) && (
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
                                        {/* ETH Payment Option - check if ETH is supported */}
                                        {ethers.constants.AddressZero in purchaseFlow.contentInfo.tokenPrices && (
                                            <div
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${purchaseFlow.selectedPaymentMethod === 'ETH'
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
                                                        {purchaseFlow.contentInfo.tokenPrices[ethers.constants.AddressZero]} ETH
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Token Payment Options */}
                                        {Object.entries(purchaseFlow.contentInfo.tokenPrices)
                                            .filter(([address]) => address !== ethers.constants.AddressZero)
                                            .map(([address, price]) => (
                                                <div
                                                    key={address}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${purchaseFlow.selectedPaymentMethod === 'ERC20' && purchaseFlow.selectedTokenAddress === address
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

                                <Button onClick={executePurchase} className="w-full" disabled={!purchaseFlow.selectedPaymentMethod}>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Purchase Access
                                    {purchaseFlow.selectedPaymentMethod === 'ETH' && ethers.constants.AddressZero in purchaseFlow.contentInfo.tokenPrices &&
                                        ` - ${purchaseFlow.contentInfo.tokenPrices[ethers.constants.AddressZero]} ETH`
                                    }
                                    {purchaseFlow.selectedPaymentMethod === 'ERC20' && purchaseFlow.selectedTokenAddress &&
                                        ` - ${purchaseFlow.contentInfo.tokenPrices[purchaseFlow.selectedTokenAddress]}`
                                    }
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}



            {/* Step 4: Processing */}
            {purchaseFlow.step === 'processing' && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {status.operation === 'approve' ? 'Processing Approval' : 'Processing Purchase'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {status.operation === 'approve'
                                    ? 'Please wait while we process your token approval...'
                                    : 'Please wait while we process your transaction...'}
                            </p>
                            {(status.txHash || status.approveHash) && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-500 break-all">
                                        Tx: {status.operation === 'approve' ? status.approveHash : status.txHash}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Purchase Complete */}
            {purchaseFlow.step === 'complete' && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Purchase Successful!</p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                You now have access to content {purchaseFlow.contentInfo?.contentId}
                            </p>

                            {(status.txHash || status.approveHash) && (
                                <div className="mt-4 space-y-3">
                                    {status.approveHash && (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Approval Transaction:
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
                                                {status.approveHash}
                                            </p>
                                        </div>
                                    )}
                                    {status.txHash && (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Purchase Transaction:
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
                                                {status.txHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button onClick={resetFlow} className="mt-4">
                                Purchase Another Content
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {status.error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4 max-w-full">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start min-w-0 flex-1">
                            <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                                    {status.operation === 'approve' ? 'Approval Failed' : 'Purchase Failed'}
                                </p>
                                <div className="text-sm text-red-700 dark:text-red-300 break-words overflow-hidden">
                                    {status.error.length > 200 ? (
                                        <details className="cursor-pointer">
                                            <summary className="font-medium">
                                                {status.error.includes('gas') ? 'Gas estimation failed' :
                                                    status.error.includes('allowance') ? 'Token allowance insufficient' :
                                                        status.error.includes('approve') ? 'Token approval required' :
                                                            'Transaction failed'}
                                            </summary>
                                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs font-mono max-h-32 overflow-y-auto">
                                                {status.error}
                                            </div>
                                        </details>
                                    ) : (
                                        <p>{status.error}</p>
                                    )}
                                </div>
                                {status.operation === 'approve' && (
                                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                        <p>• Make sure you have enough tokens for the approval</p>
                                        <p>• Check that you're connected to the correct network</p>
                                        <p>• Ensure your wallet has sufficient ETH for gas fees</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setStatus(prev => ({ ...prev, error: null }))}
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