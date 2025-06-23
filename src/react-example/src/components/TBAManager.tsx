import { useState, useEffect } from 'react'
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
            const { tbaAddress } = await sdk.checkAndCreateTBA()

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
        <div className="space-y-8">
            {/* Create New TBA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Create TBA</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* NFT Contract Address */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">NFT Contract Address</label>
                            <input
                                type="text"
                                placeholder="IPNFT contract address"
                                value={tokenContract}
                                onChange={(e) => setTokenContract(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Token ID */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Token ID</label>
                            <input
                                type="number"
                                placeholder="Enter NFT Token ID"
                                value={tokenId}
                                onChange={(e) => setTokenId(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Salt input */}
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salt Value</label>
                            <input
                                type="text"
                                placeholder="Enter salt value (1, 2, 3, etc.)"
                                value={newSalt}
                                onChange={(e) => setNewSalt(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
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

                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono space-y-2 leading-relaxed">
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
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">My TBAs</span>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTBAs}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">Refresh</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    {tbas.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">No TBAs found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">
                                Create your first TBA above
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tbas.map((tba, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-800 rounded p-4 bg-gray-50 dark:bg-gray-900">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">TBA Address</p>
                                            <p className="font-mono text-sm text-gray-900 dark:text-gray-100 mt-1">{formatAddress(tba.address)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">NFT Contract</p>
                                            <p className="font-mono text-sm text-gray-900 dark:text-gray-100 mt-1">{formatAddress(tba.tokenContract)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Token ID</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono">{tba.tokenId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salt</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{tba.salt}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</p>
                                            <p className="text-sm flex items-center text-gray-900 dark:text-gray-100 mt-1">
                                                <Coins className="h-3 w-3 mr-1 text-gray-500" />
                                                <span className="font-mono">{tba.balance} ETH</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valid Signer</p>
                                            <p className="text-sm mt-1">
                                                {tba.isValidSigner ? (
                                                    <span className="text-green-600 dark:text-green-400 font-mono">✓ Yes</span>
                                                ) : (
                                                    <span className="text-red-600 dark:text-red-400 font-mono">✗ No</span>
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