import React, { useState } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Coins, CheckCircle, AlertCircle } from 'lucide-react'

interface NFTMinterProps {
    sdk: GoTakeSDK
    address: string
}

interface MintStatus {
    status: 'idle' | 'minting' | 'success' | 'error'
    txHash?: string
    tokenId?: string
    error?: string
}

export function NFTMinter({ sdk, address }: NFTMinterProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('')
    const [mintStatus, setMintStatus] = useState<MintStatus>({ status: 'idle' })

    const mintNFT = async () => {
        if (!title.trim() || !description.trim()) {
            setMintStatus({
                status: 'error',
                error: 'Title and description are required'
            })
            return
        }

        setMintStatus({ status: 'minting' })

        try {
            const metadata = {
                title: title.trim(),
                description: description.trim(),
                creator: address,
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
            }

            const result = await sdk.ipnft.mint(address, metadata)
            const receipt = await result.tx.wait()

            setMintStatus({
                status: 'success',
                txHash: receipt.transactionHash,
                tokenId: result.tokenId.toString()
            })

            // Reset form
            setTitle('')
            setDescription('')
            setTags('')

        } catch (error) {
            console.error('Error minting NFT:', error)
            setMintStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to mint NFT'
            })
        }
    }

    const resetStatus = () => {
        setMintStatus({ status: 'idle' })
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Mint IPNFT</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Form */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter NFT title"
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter NFT description"
                                rows={4}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors resize-none"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g. art, digital, collectible"
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>
                    </div>

                    {/* Status Display */}
                    {mintStatus.status !== 'idle' && (
                        <div className="border border-gray-200 dark:border-gray-800 rounded p-4 bg-gray-50 dark:bg-gray-900">
                            {mintStatus.status === 'minting' && (
                                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300"></div>
                                    <span className="text-sm font-mono">Minting NFT...</span>
                                </div>
                            )}

                            {mintStatus.status === 'success' && (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">NFT Minted Successfully!</span>
                                    </div>
                                    <div className="text-sm space-y-2">
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Token ID:</span> <span className="font-mono text-gray-900 dark:text-gray-100">{mintStatus.tokenId}</span></p>
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction:</span>
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${mintStatus.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-mono ml-1 underline"
                                            >
                                                {mintStatus.txHash?.slice(0, 10)}...
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mintStatus.status === 'error' && (
                                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-mono">{mintStatus.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3">
                        <Button
                            onClick={mintNFT}
                            disabled={mintStatus.status === 'minting' || !title.trim() || !description.trim()}
                            className="flex-1"
                        >
                            {mintStatus.status === 'minting' ? 'Minting...' : 'Mint NFT'}
                        </Button>

                        {mintStatus.status !== 'idle' && mintStatus.status !== 'minting' && (
                            <Button
                                variant="outline"
                                onClick={resetStatus}
                                size="default"
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono leading-relaxed">
                        This will create an Intellectual Property NFT (IPNFT) on the blockchain.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
} 