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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Coins className="h-5 w-5" />
                        <span>Mint IPNFT</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter NFT title"
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter NFT description"
                                rows={3}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm resize-none"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g. art, digital, collectible"
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                                disabled={mintStatus.status === 'minting'}
                            />
                        </div>
                    </div>

                    {/* Status Display */}
                    {mintStatus.status !== 'idle' && (
                        <div className="border rounded-lg p-4">
                            {mintStatus.status === 'minting' && (
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm">Minting NFT...</span>
                                </div>
                            )}

                            {mintStatus.status === 'success' && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">NFT Minted Successfully!</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p><strong>Token ID:</strong> {mintStatus.tokenId}</p>
                                        <p><strong>Transaction:</strong>
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${mintStatus.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline ml-1"
                                            >
                                                {mintStatus.txHash?.slice(0, 10)}...
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mintStatus.status === 'error' && (
                                <div className="flex items-center space-x-2 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">{mintStatus.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
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
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This will create an Intellectual Property NFT (IPNFT) on the blockchain.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
} 