import { useState } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Plus, Search, Edit, Trash2, Check, X, Loader2 } from 'lucide-react'
import { ethers } from 'ethers'

interface ContentManagerProps {
    sdk: GoTakeSDK
}

interface TokenPrice {
    address: string
    price: string
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

export function ContentManager({ sdk }: ContentManagerProps) {
    // Create content state
    const [createForm, setCreateForm] = useState({
        contentId: '',
        nativePrice: '',
        viewCount: '',
        durationHours: '',
        isActive: true
    })
    const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([])
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

    // Token price management functions
    const addTokenPrice = () => {
        setTokenPrices([...tokenPrices, { address: '', price: '' }])
    }

    const removeTokenPrice = (index: number) => {
        setTokenPrices(tokenPrices.filter((_, i) => i !== index))
    }

    const updateTokenPrice = (index: number, field: 'address' | 'price', value: string) => {
        const updated = [...tokenPrices]
        updated[index][field] = value
        setTokenPrices(updated)
    }

    // Create content function
    const createContent = async () => {
        setCreateStatus({ loading: true, success: false, error: null })

        try {
            // Validate inputs
            const contentId = parseInt(createForm.contentId)
            const viewCount = parseInt(createForm.viewCount)
            const durationHours = parseFloat(createForm.durationHours)

            if (isNaN(contentId) || isNaN(viewCount) || isNaN(durationHours)) {
                throw new Error('Please provide valid numeric values')
            }

            if (viewCount <= 0 || durationHours <= 0) {
                throw new Error('View count and duration must be greater than 0')
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

            // Validate token prices
            const validTokenPrices: Record<string, string> = {}
            for (const token of tokenPrices) {
                if (token.address && token.price) {
                    if (!ethers.utils.isAddress(token.address)) {
                        throw new Error(`Invalid token address: ${token.address}`)
                    }
                    try {
                        const tokenPriceWei = ethers.utils.parseEther(token.price)
                        if (tokenPriceWei.lte(0)) {
                            throw new Error(`Token price must be greater than 0: ${token.address}`)
                        }
                        validTokenPrices[token.address] = token.price
                    } catch {
                        throw new Error(`Invalid token price format: ${token.address}`)
                    }
                }
            }

            // Execute content creation
            const txHash = await sdk.videoPayment.setContentConfig({
                contentId,
                nativePrice: createForm.nativePrice,
                defaultViewCount: viewCount,
                viewDuration: durationHours * 3600, // Convert hours to seconds
                isActive: createForm.isActive,
                ...(Object.keys(validTokenPrices).length > 0 && { tokenPrices: validTokenPrices })
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
            setTokenPrices([])

        } catch (error) {
            setCreateStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create content',
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
            setQueryStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to query content'
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
            setUpdateStatus({
                loading: false,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update price',
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

                    {/* Token Prices */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Token Prices
                            </label>
                            <Button
                                type="button"
                                onClick={addTokenPrice}
                                className="text-sm px-3 py-1"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Token
                            </Button>
                        </div>
                        {tokenPrices.map((token, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Token Address"
                                    value={token.address}
                                    onChange={(e) => updateTokenPrice(index, 'address', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Price"
                                    value={token.price}
                                    onChange={(e) => updateTokenPrice(index, 'price', e.target.value)}
                                />
                                <Button
                                    type="button"
                                    onClick={() => removeTokenPrice(index)}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
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

                    {/* Create Status */}
                    {createStatus.error && !createStatus.success && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{createStatus.error}</span>
                            </div>
                            <button onClick={resetCreateStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
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

                    {/* Query Status */}
                    {queryStatus.error && !queryStatus.success && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{queryStatus.error}</span>
                            </div>
                            <button onClick={resetQueryStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
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
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{contentInfo.defaultViewCount}</p>
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

                    {/* Update Status */}
                    {updateStatus.error && !updateStatus.success && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start justify-between">
                            <div className="flex items-start">
                                <X className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span className="text-red-700 dark:text-red-300">{updateStatus.error}</span>
                            </div>
                            <button onClick={resetUpdateStatus} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
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