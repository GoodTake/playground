import React, { useState, useEffect } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { ethers } from 'ethers'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { formatAddress } from '../lib/utils'
import { Plus, Hash, Coins, RefreshCw } from 'lucide-react'

interface TBAManagerProps {
    sdk: GoTakeSDK
}

interface TBAData {
    address: string
    salt: string
    balance: string
    tokenContract: string
    tokenId: string
    isValidSigner: boolean
}

export function TBAManager({ sdk }: TBAManagerProps) {
    const [tbas, setTBAs] = useState<TBAData[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newSalt, setNewSalt] = useState('1')
    const [tokenContract, setTokenContract] = useState('0xE71014657C0AC1bF1Bbc3a85E0b21087A83411f4')
    const [tokenId, setTokenId] = useState('1')

    const fetchTBAs = async () => {
        setLoading(true)
        try {
            // Check if user has any existing TBA
            const { tbaAddress, isNew } = await sdk.checkAndCreateTBA()

            if (tbaAddress) {
                const balance = await sdk.provider.getBalance(tbaAddress)
                const tbaInfo = await sdk.account.getTBAInfo(tbaAddress)
                const userAddress = await sdk.getAddress()
                const isValidSigner = await sdk.account.isValidSigner(tbaAddress, userAddress)

                setTBAs([{
                    address: tbaAddress,
                    salt: 'Default',
                    balance: (Number(balance) / 1e18).toFixed(4),
                    tokenContract: tbaInfo.tokenContract,
                    tokenId: tbaInfo.tokenId.toString(),
                    isValidSigner
                }])
            } else {
                setTBAs([])
            }
        } catch (error) {
            console.error('Error fetching TBAs:', error)
            setTBAs([])
        } finally {
            setLoading(false)
        }
    }

    const createTBA = async () => {
        if (!newSalt.trim()) {
            alert('Please enter a salt value')
            return
        }

        if (!tokenContract.trim()) {
            alert('Please enter NFT contract address')
            return
        }

        if (!tokenId.trim()) {
            alert('Please enter Token ID')
            return
        }

        setCreating(true)
        try {
            const userAddress = await sdk.getAddress()

            console.log(`Creating TBA for NFT ${tokenContract}:${tokenId} with salt: ${newSalt}`)

            // Convert salt to bytes32 format
            const saltBytes32 = ethers.utils.formatBytes32String(newSalt)

            // Create TBA for any ERC-721 NFT
            const createResult = await sdk.account.createTBA({
                tokenContract: tokenContract.trim(),
                tokenId: parseInt(tokenId),
                salt: saltBytes32
            })

            await createResult.tx.wait()
            console.log(`TBA created: ${createResult.tbaAddress}`)

            // Get TBA info
            const balance = await sdk.provider.getBalance(createResult.tbaAddress)
            const tbaInfo = await sdk.account.getTBAInfo(createResult.tbaAddress)
            const isValidSigner = await sdk.account.isValidSigner(createResult.tbaAddress, userAddress)

            const tbaData: TBAData = {
                address: createResult.tbaAddress,
                salt: newSalt,
                balance: (Number(balance) / 1e18).toFixed(4),
                tokenContract: tokenContract.trim(),
                tokenId: tokenId,
                isValidSigner
            }

            // Add to list
            setTBAs(prev => [...prev, tbaData])
            setNewSalt('')
            setTokenContract('')
            setTokenId('')

        } catch (error) {
            console.error('Error creating TBA:', error)
            alert('Failed to create TBA: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setCreating(false)
        }
    }

    useEffect(() => {
        fetchTBAs()
    }, [sdk])

    return (
        <div className="space-y-6">
            {/* Create New TBA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Plus className="h-5 w-5" />
                        <span>Create TBA</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* NFT Contract Address */}
                        <div>
                            <label className="text-sm font-medium">NFT Contract Address</label>
                            <input
                                type="text"
                                placeholder="IPNFT contract address"
                                value={tokenContract}
                                onChange={(e) => setTokenContract(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm font-mono"
                            />
                        </div>

                        {/* Token ID */}
                        <div>
                            <label className="text-sm font-medium">Token ID</label>
                            <input
                                type="number"
                                placeholder="Enter NFT Token ID"
                                value={tokenId}
                                onChange={(e) => setTokenId(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                            />
                        </div>

                        {/* Salt input */}
                        <div>
                            <label className="text-sm font-medium">Salt Value</label>
                            <input
                                type="text"
                                placeholder="Enter salt value (1, 2, 3, etc.)"
                                value={newSalt}
                                onChange={(e) => setNewSalt(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                            />
                        </div>

                        {/* Create button */}
                        <Button
                            onClick={createTBA}
                            disabled={creating || !newSalt.trim() || !tokenContract.trim() || !tokenId.trim()}
                            className="w-full"
                        >
                            {creating ? 'Creating...' : 'Create TBA'}
                        </Button>

                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>• TBA address is computed from (contract, tokenId, salt)</p>
                            <p>• Different salt values create different TBA addresses</p>
                            <p>• Works with any ERC-721 NFT contract</p>
                            <p>• NFT owner controls the TBA</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TBA List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <Hash className="h-5 w-5" />
                        <span>My TBAs</span>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTBAs}
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
                    {tbas.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No TBAs found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create your first TBA above
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tbas.map((tba, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">TBA Address</p>
                                            <p className="font-mono text-sm">{formatAddress(tba.address)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">NFT Contract</p>
                                            <p className="font-mono text-sm">{formatAddress(tba.tokenContract)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Token ID</p>
                                            <p className="text-sm">{tba.tokenId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Salt</p>
                                            <p className="text-sm">{tba.salt}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Balance</p>
                                            <p className="text-sm flex items-center">
                                                <Coins className="h-3 w-3 mr-1" />
                                                {tba.balance} ETH
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Valid Signer</p>
                                            <p className="text-sm">
                                                {tba.isValidSigner ? (
                                                    <span className="text-green-600">✓ Yes</span>
                                                ) : (
                                                    <span className="text-red-600">✗ No</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 