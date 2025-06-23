import { useState } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Plus, Search, Edit, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { ethers } from 'ethers'

interface ContentManagerProps {
    sdk: GoTakeSDK
}

interface ContentInfo {
    contentId: number
    isActive: boolean
    defaultViewCount: number
    viewDuration: number
    nativePrice: string
    tokenPrices: Record<string, string>
}

interface OperationStatus {
    loading: boolean
    success: boolean
    error: string | null
    txHash?: string
}

interface ErrorDisplayProps {
    error: string
    onClose: () => void
}

function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
    const [showFullError, setShowFullError] = useState(false)

    // Intelligent error truncation
    const truncateError = (errorMessage: string, maxLength: number = 150): {
        truncated: string,
        needsTruncation: boolean,
        summary: string
    } => {
        if (errorMessage.length <= maxLength) {
            return {
                truncated: errorMessage,
                needsTruncation: false,
                summary: errorMessage
            }
        }

        // Extract key information for summary
        let summary = errorMessage

        // Handle common error patterns
        if (errorMessage.includes('user rejected transaction')) {
            summary = 'Transaction was rejected by user'
        } else if (errorMessage.includes('UNPREDICTABLE_GAS_LIMIT')) {
            summary = 'Gas estimation failed - please check parameters'
        } else if (errorMessage.includes('ACTION_REJECTED')) {
            summary = 'Transaction was rejected'
        } else if (errorMessage.includes('insufficient funds')) {
            summary = 'Insufficient funds for transaction'
        } else {
            // Generic truncation
            summary = errorMessage.substring(0, maxLength) + '...'
        }

        return {
            truncated: summary,
            needsTruncation: true,
            summary: summary
        }
    }

    const { truncated, needsTruncation, summary } = truncateError(error)

    return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 max-w-full">
            <div className="flex items-start justify-between">
                <div className="flex items-start min-w-0 flex-1">
                    <X className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="text-red-700 dark:text-red-300 break-words">
                            {showFullError ? (
                                <div className="max-h-32 overflow-y-auto text-sm font-mono bg-red-100 dark:bg-red-900 p-2 rounded">
                                    {error}
                                </div>
                            ) : (
                                <span>{summary}</span>
                            )}
                        </div>
                        {needsTruncation && (
                            <button
                                onClick={() => setShowFullError(!showFullError)}
                                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm flex items-center"
                            >
                                {showFullError ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-1" />
                                        Hide Details
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        Show Details
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 ml-2">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

export function ContentManager({ sdk }: ContentManagerProps) {
    // Create content state
    const [createForm, setCreateForm] = useState({
        contentId: '',
        nativePrice: '',
        viewCount: '',
        durationHours: '',
        isActive: true
    })
    const [createStatus, setCreateStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Query content state
    const [queryContentId, setQueryContentId] = useState('')
    const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null)
    const [queryStatus, setQueryStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Update price state
    const [updateForm, setUpdateForm] = useState({
        contentId: '',
        newPrice: '',
        paymentType: 'ETH' as 'ETH' | 'ERC20',
        tokenAddress: ''
    })
    const [updateStatus, setUpdateStatus] = useState<OperationStatus>({
        loading: false,
        success: false,
        error: null
    })

    // Helper function to format error messages for better UX
    const formatErrorMessage = (error: string): string => {
        // Keep original functionality for basic formatting
        if (error.includes('UNPREDICTABLE_GAS_LIMIT')) {
            return 'Transaction may fail due to gas estimation issues. Please check your parameters and try again.'
        }
        if (error.includes('cannot estimate gas')) {
            return 'Unable to estimate gas for this transaction. Please verify all parameters are correct.'
        }
        return error
    }

    // Create content function
    const createContent = async () => {
        setCreateStatus({ loading: true, success: false, error: null })

        try {
            // Initialize SDK before creating content
            await sdk.videoPayment.init()

            // Validate inputs
            const contentId = parseInt(createForm.contentId)
            const viewCount = parseInt(createForm.viewCount)
            const durationHours = parseFloat(createForm.durationHours)

            if (isNaN(contentId) || isNaN(viewCount) || isNaN(durationHours)) {
                throw new Error('Please provide valid numeric values')
            }

            // Updated validation: allow viewCount = 0 for unlimited views
            if (viewCount < 0) {
                throw new Error('View count cannot be negative (0 = unlimited views)')
            }

            if (durationHours <= 0) {
                throw new Error('Duration must be greater than 0')
            }

            // Validate native price
            try {
                const priceWei = ethers.utils.parseEther(createForm.nativePrice)
                if (priceWei.lte(0)) {
                    throw new Error('Native price must be greater than 0')
                }
            } catch {
                throw new Error('Invalid native price format')
            }

            // Execute content creation - simplified to match reference script
            const txHash = await sdk.videoPayment.setContentConfig({
                contentId,
                nativePrice: createForm.nativePrice,
                defaultViewCount: viewCount,
                viewDuration: durationHours * 3600, // Convert hours to seconds
                isActive: createForm.isActive
            })

            setCreateStatus({
                loading: false,
                success: true,
                error: null,
                txHash
            })

            // Reset form
            setCreateForm({
                contentId: '',
                nativePrice: '',
                viewCount: '',
                durationHours: '',
                isActive: true
            })

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create content'
            setCreateStatus({
                loading: false,
                success: false,
                error: formatErrorMessage(errorMessage),
                txHash: undefined // Clear any previous txHash
            })
        }
    }

    // Query content function
    const queryContent = async () => {
        setQueryStatus({ loading: true, success: false, error: null })

        try {
            const contentId = parseInt(queryContentId)
            if (isNaN(contentId)) {
                throw new Error('Please provide a valid content ID')
            }

            const rawInfo = await sdk.videoPayment.getContentInfo(contentId)

            const info: ContentInfo = {
                contentId,
                isActive: rawInfo.isActive,
                defaultViewCount: rawInfo.defaultViewCount,
                viewDuration: rawInfo.viewDuration,
                nativePrice: ethers.utils.formatEther(rawInfo.nativePrice),
                tokenPrices: Object.fromEntries(
                    Object.entries(rawInfo.tokenPrices || {}).map(([addr, price]) =>
                        [addr, ethers.utils.formatEther(price)]
                    )
                )
            }

            setContentInfo(info)
            setQueryStatus({ loading: false, success: true, error: null })

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to query content'
            setQueryStatus({
                loading: false,
                success: false,
                error: formatErrorMessage(errorMessage)
            })
            setContentInfo(null)
        }
    }

    // Update price function
    const updatePrice = async () => {
        setUpdateStatus({ loading: true, success: false, error: null })

        try {
            const contentId = parseInt(updateForm.contentId)
            if (isNaN(contentId)) {
                throw new Error('Please provide a valid content ID')
            }

            // Validate price format
            try {
                const priceWei = ethers.utils.parseEther(updateForm.newPrice)
                if (priceWei.lte(0)) {
                    throw new Error('Price must be greater than 0')
                }
            } catch {
                throw new Error('Invalid price format')
            }

            // Validate ERC20 token address if needed
            if (updateForm.paymentType === 'ERC20') {
                if (!updateForm.tokenAddress) {
                    throw new Error('Token address is required for ERC20 price updates')
                }
                if (!ethers.utils.isAddress(updateForm.tokenAddress)) {
                    throw new Error('Invalid token address format')
                }
            }

            let txHash: string

            // Update content price based on payment type
            if (updateForm.paymentType === 'ERC20') {
                // Use final processed token address for ERC20 updates
                const finalTokenAddress = updateForm.tokenAddress || ethers.constants.AddressZero
                txHash = await sdk.videoPayment.updateContentPrice(
                    contentId,
                    ethers.utils.parseEther(updateForm.newPrice),
                    finalTokenAddress
                )
            } else {
                // ETH price update
                txHash = await sdk.videoPayment.updateContentPrice(
                    contentId,
                    ethers.utils.parseEther(updateForm.newPrice)
                )
            }

            setUpdateStatus({
                loading: false,
                success: true,
                error: null,
                txHash
            })

            // Reset form
            setUpdateForm({
                contentId: '',
                newPrice: '',
                paymentType: 'ETH',
                tokenAddress: ''
            })

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update price'
            setUpdateStatus({
                loading: false,
                success: false,
                error: formatErrorMessage(errorMessage),
                txHash: undefined // Clear any previous txHash
            })
        }
    }

    // Reset status functions - ensure complete state reset
    const resetCreateStatus = () => setCreateStatus({ loading: false, success: false, error: null, txHash: undefined })
    const resetQueryStatus = () => setQueryStatus({ loading: false, success: false, error: null })
    const resetUpdateStatus = () => setUpdateStatus({ loading: false, success: false, error: null, txHash: undefined })

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Content Management</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Create, query, and update video content configurations</p>
            </div>

            {/* Create Content Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Content
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Content ID
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter content ID"
                                value={createForm.contentId}
                                onChange={(e) => setCreateForm({ ...createForm, contentId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Native Price (ETH)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.001"
                                value={createForm.nativePrice}
                                onChange={(e) => setCreateForm({ ...createForm, nativePrice: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                View Count
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="10"
                                value={createForm.viewCount}
                                onChange={(e) => setCreateForm({ ...createForm, viewCount: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter 0 for unlimited views, or any positive number for limited views
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duration (Hours)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="24"
                                value={createForm.durationHours}
                                onChange={(e) => setCreateForm({ ...createForm, durationHours: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded"
                            checked={createForm.isActive}
                            onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                            Content Active
                        </label>
                    </div>

                    <Button
                        onClick={createContent}
                        disabled={createStatus.loading}
                        className="w-full"
                    >
                        {createStatus.loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Content'
                        )}
                    </Button>

                    {/* Create Status - Enhanced error display */}
                    {createStatus.error && !createStatus.success && (
                        <ErrorDisplay
                            error={createStatus.error}
                            onClose={resetCreateStatus}
                        />
                    )}
                    {createStatus.success && !createStatus.error && (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-green-700 dark:text-green-300">Content created successfully!</p>
                                    {createStatus.txHash && (
                                        <div className="mt-2">
                                            <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-1">
                                                Transaction Hash:
                                            </p>
                                            <p className="text-green-600 dark:text-green-400 text-sm break-all bg-green-100 dark:bg-green-900 p-2 rounded">
                                                {createStatus.txHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={resetCreateStatus} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Query Content Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Query Content Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter content ID to query"
                            value={queryContentId}
                            onChange={(e) => setQueryContentId(e.target.value)}
                        />
                        <Button
                            onClick={queryContent}
                            disabled={queryStatus.loading}
                        >
                            {queryStatus.loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Query Status - Enhanced error display */}
                    {queryStatus.error && !queryStatus.success && (
                        <ErrorDisplay
                            error={queryStatus.error}
                            onClose={resetQueryStatus}
                        />
                    )}

                    {/* Content Information Display */}
                    {contentInfo && (
                        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md p-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Content Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Content ID:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{contentInfo.contentId}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                                    <p className={`font-medium ${contentInfo.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {contentInfo.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">View Count:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {contentInfo.defaultViewCount === 0 ? 'Unlimited' : contentInfo.defaultViewCount}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{Math.floor(contentInfo.viewDuration / 3600)} hours</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Native Price:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{contentInfo.nativePrice} ETH</p>
                                </div>
                            </div>

                            {/* Filter out AddressZero and show only ERC20 tokens */}
                            {Object.entries(contentInfo.tokenPrices)
                                .filter(([address]) => address !== ethers.constants.AddressZero)
                                .length > 0 && (
                                    <div className="mt-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Token Prices:</span>
                                        <div className="mt-2 space-y-2">
                                            {Object.entries(contentInfo.tokenPrices)
                                                .filter(([address]) => address !== ethers.constants.AddressZero)
                                                .map(([address, price]) => (
                                                    <div key={address} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Token Address:</p>
                                                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{address}</p>
                                                            </div>
                                                            <div className="ml-4 text-right">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price:</p>
                                                                <p className="font-medium text-gray-900 dark:text-gray-100">{price} tokens</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Update Price Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Update Content Price
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Content ID
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter content ID"
                                value={updateForm.contentId}
                                onChange={(e) => setUpdateForm({ ...updateForm, contentId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Type
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={updateForm.paymentType}
                                onChange={(e) => setUpdateForm({ ...updateForm, paymentType: e.target.value as 'ETH' | 'ERC20' })}
                            >
                                <option value="ETH">ETH (Native)</option>
                                <option value="ERC20">ERC20 Token</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Price
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.001"
                                value={updateForm.newPrice}
                                onChange={(e) => setUpdateForm({ ...updateForm, newPrice: e.target.value })}
                            />
                        </div>
                        {updateForm.paymentType === 'ERC20' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Token Address
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0x..."
                                    value={updateForm.tokenAddress}
                                    onChange={(e) => setUpdateForm({ ...updateForm, tokenAddress: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={updatePrice}
                        disabled={updateStatus.loading}
                        className="w-full"
                    >
                        {updateStatus.loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Price'
                        )}
                    </Button>

                    {/* Update Status - Enhanced error display */}
                    {updateStatus.error && !updateStatus.success && (
                        <ErrorDisplay
                            error={updateStatus.error}
                            onClose={resetUpdateStatus}
                        />
                    )}
                    {updateStatus.success && !updateStatus.error && (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-green-700 dark:text-green-300">Price updated successfully!</p>
                                    {updateStatus.txHash && (
                                        <div className="mt-2">
                                            <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-1">
                                                Transaction Hash:
                                            </p>
                                            <p className="text-green-600 dark:text-green-400 text-sm break-all bg-green-100 dark:bg-green-900 p-2 rounded">
                                                {updateStatus.txHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={resetUpdateStatus} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 