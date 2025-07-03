import { useState, useEffect } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { formatAddress } from '../lib/utils'
import { Plus, Coins, RefreshCw, ArrowUpDown, Wallet } from 'lucide-react'
import { getBlockExplorerUrl } from '../lib/network-utils'

interface TBAManagerProps {
    sdk: GoTakeSDK
}

interface AccountNFTInfo {
    tokenId: string
    owner: string
    tbaAddress: string
    ethBalance: string
    erc20Balances: Record<string, string>
    accountInfo: {
        name: string
        description: string
        establishedAt: string
    }
}

interface TransferStatus {
    status: 'idle' | 'transferring' | 'success' | 'error'
    txHash?: string
    error?: string
}

interface CreateAccountStatus {
    status: 'idle' | 'creating' | 'success' | 'error'
    accountNFTTx?: string
    tbaTx?: string
    tokenId?: string
    tbaAddress?: string
    error?: string
}

export function TBAManager({ sdk }: TBAManagerProps) {
    const { chain } = useAccount()
    const [accounts, setAccounts] = useState<AccountNFTInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [createStatus, setCreateStatus] = useState<CreateAccountStatus>({ status: 'idle' })
    const [transferStatus, setTransferStatus] = useState<TransferStatus>({ status: 'idle' })

    // Transfer form state
    const [transferDirection, setTransferDirection] = useState<'EOA_TO_TBA' | 'TBA_TO_EOA'>('EOA_TO_TBA')
    const [transferType, setTransferType] = useState<'ETH' | 'ERC20'>('ETH')
    const [transferAmount, setTransferAmount] = useState('')
    const [selectedTBA, setSelectedTBA] = useState('')
    const [erc20Address, setErc20Address] = useState('')

    // Fetch user's AccountNFTs and their TBAs
    const fetchAccounts = async () => {
        setLoading(true)
        try {
            // For now, we'll check if user has any AccountNFT by trying to create one
            // In a real implementation, you'd query the AccountNFT contract for user's tokens
            // This is a simplified approach for the demo
            setAccounts([])
        } catch (error) {
            console.error('Error fetching accounts:', error)
            setAccounts([])
        } finally {
            setLoading(false)
        }
    }

    // Create new user account (AccountNFT + TBA)
    const createNewAccount = async () => {
        setCreateStatus({ status: 'creating' })

        try {
            const userAddress = await sdk.getAddress()

            console.log('Creating new user account...')

            const result = await sdk.account.createNewUserAccount({
                recipientAddress: userAddress,
                accountNFTMetadata: {
                    uri: `account://${userAddress}/metadata`
                },
                tbaConfig: {
                    salt: '0x0000000000000000000000000000000000000000000000000000000000000000'
                }
            })

            console.log('Account creation result:', result)

            // Wait for transactions to be mined
            const accountNFTReceipt = await result.accountNFT.tx.wait()
            const tbaReceipt = await result.tba.tx.wait()

            setCreateStatus({
                status: 'success',
                accountNFTTx: accountNFTReceipt.transactionHash,
                tbaTx: tbaReceipt.transactionHash,
                tokenId: result.accountNFT.tokenId.toString(),
                tbaAddress: result.tba.tbaAddress
            })

            // Wait for next block before querying account details
            const currentBlock = await sdk.provider.getBlockNumber()
            const targetBlock = currentBlock + 1

            // Wait for target block
            await new Promise((resolve) => {
                const checkBlock = async () => {
                    const latestBlock = await sdk.provider.getBlockNumber()
                    if (latestBlock >= targetBlock) {
                        resolve(undefined)
                    } else {
                        setTimeout(checkBlock, 1000) // Check every second
                    }
                }
                checkBlock()
            })

            // Now fetch account details
            try {
                await fetchAccountDetails(result.accountNFT.tokenId.toString(), result.tba.tbaAddress)
            } catch (error) {
                console.warn('Failed to fetch account details after creation, but account was created successfully:', error)
            }

        } catch (error) {
            console.error('Error creating account:', error)
            setCreateStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to create account'
            })
        }
    }

    // Fetch detailed account information
    const fetchAccountDetails = async (tokenId: string, tbaAddress: string) => {
        try {
            const userAddress = await sdk.getAddress()

            // Get TBA ETH balance
            const ethBalance = await sdk.provider.getBalance(tbaAddress)
            const ethBalanceFormatted = ethers.utils.formatEther(ethBalance)

            // Get account info from AccountNFT
            const accountInfo = await sdk.account.getAccountInfo(tokenId)

            const accountData: AccountNFTInfo = {
                tokenId,
                owner: userAddress,
                tbaAddress,
                ethBalance: ethBalanceFormatted,
                erc20Balances: {}, // TODO: Implement ERC20 balance fetching
                accountInfo: {
                    name: accountInfo.name,
                    description: accountInfo.description,
                    establishedAt: new Date(accountInfo.establishedAt.toNumber() * 1000).toLocaleString()
                }
            }

            setAccounts(prev => {
                const existing = prev.find(acc => acc.tokenId === tokenId)
                if (existing) {
                    return prev.map(acc => acc.tokenId === tokenId ? accountData : acc)
                } else {
                    return [...prev, accountData]
                }
            })

        } catch (error) {
            console.error('Error fetching account details:', error)
        }
    }

    // Execute transfer between EOA and TBA
    const executeTransfer = async () => {
        if (!selectedTBA || !transferAmount) {
            return
        }

        setTransferStatus({ status: 'transferring' })

        try {
            const userAddress = await sdk.getAddress()
            let txHash: string

            if (transferType === 'ETH') {
                if (transferDirection === 'EOA_TO_TBA') {
                    // Send ETH from EOA to TBA
                    const tx = await sdk.signer.sendTransaction({
                        to: selectedTBA,
                        value: ethers.utils.parseEther(transferAmount)
                    })
                    const receipt = await tx.wait()
                    txHash = receipt.transactionHash
                } else {
                    // Send ETH from TBA to EOA
                    const result = await sdk.account.executeTBATransaction({
                        accountAddress: selectedTBA,
                        to: userAddress,
                        value: ethers.utils.parseEther(transferAmount),
                        data: '0x'
                    })
                    const receipt = await result.tx.wait()
                    txHash = receipt.transactionHash
                }
            } else {
                // ERC20 transfer
                if (!erc20Address) {
                    throw new Error('ERC20 contract address is required')
                }

                const erc20Interface = new ethers.utils.Interface([
                    'function transfer(address to, uint256 amount) returns (bool)',
                    'function transferFrom(address from, address to, uint256 amount) returns (bool)'
                ])

                if (transferDirection === 'EOA_TO_TBA') {
                    // Transfer ERC20 from EOA to TBA
                    const erc20Contract = new ethers.Contract(erc20Address, [
                        'function transfer(address to, uint256 amount) returns (bool)',
                        'function decimals() view returns (uint8)'
                    ], sdk.signer)

                    const decimals = await erc20Contract.decimals()
                    const amount = ethers.utils.parseUnits(transferAmount, decimals)

                    const tx = await erc20Contract.transfer(selectedTBA, amount)
                    const receipt = await tx.wait()
                    txHash = receipt.transactionHash
                } else {
                    // Transfer ERC20 from TBA to EOA
                    const erc20Contract = new ethers.Contract(erc20Address, [
                        'function decimals() view returns (uint8)'
                    ], sdk.provider)

                    const decimals = await erc20Contract.decimals()
                    const amount = ethers.utils.parseUnits(transferAmount, decimals)

                    const transferData = erc20Interface.encodeFunctionData('transfer', [userAddress, amount])

                    const result = await sdk.account.executeTBATransaction({
                        accountAddress: selectedTBA,
                        to: erc20Address,
                        value: 0,
                        data: transferData
                    })
                    const receipt = await result.tx.wait()
                    txHash = receipt.transactionHash
                }
            }

            setTransferStatus({
                status: 'success',
                txHash
            })

            // Reset form
            setTransferAmount('')
            setErc20Address('')

            // Refresh account details
            const account = accounts.find(acc => acc.tbaAddress === selectedTBA)
            if (account) {
                await fetchAccountDetails(account.tokenId, account.tbaAddress)
            }

        } catch (error) {
            console.error('Error executing transfer:', error)
            setTransferStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Transfer failed'
            })
        }
    }

    // Reset status functions
    const resetCreateStatus = () => setCreateStatus({ status: 'idle' })
    const resetTransferStatus = () => setTransferStatus({ status: 'idle' })

    useEffect(() => {
        fetchAccounts()
    }, [sdk])

    return (
        <div className="space-y-8">
            {/* Create New Account */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Create New Account</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Display */}
                    {createStatus.status !== 'idle' && (
                        <div className="border border-gray-200 dark:border-gray-800 rounded p-4 bg-gray-50 dark:bg-gray-900">
                            {createStatus.status === 'creating' && (
                                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300"></div>
                                    <span className="text-sm font-mono">Creating account...</span>
                                </div>
                            )}

                            {createStatus.status === 'success' && (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                                        <Plus className="h-4 w-4" />
                                        <span className="text-sm font-medium">Account Created Successfully!</span>
                                    </div>
                                    <div className="text-sm space-y-2">
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">AccountNFT Token ID:</span> <span className="font-mono text-gray-900 dark:text-gray-100">{createStatus.tokenId}</span></p>
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">TBA Address:</span> <span className="font-mono text-gray-900 dark:text-gray-100">{createStatus.tbaAddress ? formatAddress(createStatus.tbaAddress, 15) : ''}</span></p>
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">AccountNFT Tx:</span>
                                            <a
                                                href={getBlockExplorerUrl(chain?.id!, createStatus.accountNFTTx || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-mono ml-1 underline"
                                            >
                                                {createStatus.accountNFTTx?.slice(0, 10)}...
                                            </a>
                                        </p>
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">TBA Tx:</span>
                                            <a
                                                href={getBlockExplorerUrl(chain?.id!, createStatus.tbaTx || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-mono ml-1 underline"
                                            >
                                                {createStatus.tbaTx?.slice(0, 10)}...
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {createStatus.status === 'error' && (
                                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                    <Plus className="h-4 w-4" />
                                    <span className="text-sm font-mono">{createStatus.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Button
                            onClick={createNewAccount}
                            disabled={createStatus.status === 'creating'}
                            className="flex-1"
                        >
                            {createStatus.status === 'creating' ? 'Creating...' : 'Create Account'}
                        </Button>

                        {createStatus.status !== 'idle' && createStatus.status !== 'creating' && (
                            <Button
                                variant="outline"
                                onClick={resetCreateStatus}
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono leading-relaxed">
                        Creates an AccountNFT and its corresponding Token Bound Account (TBA) in one transaction.
                    </p>
                </CardContent>
            </Card>

            {/* Account List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Your Accounts</span>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAccounts}
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
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                            <span className="ml-2 text-sm font-mono text-gray-600 dark:text-gray-400">Loading accounts...</span>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center py-8">
                            <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">No accounts found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">Create your first account above</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {accounts.map((account, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">AccountNFT Token ID</p>
                                                <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{account.tokenId}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">TBA Address</p>
                                                <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{formatAddress(account.tbaAddress, 15)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Name</p>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{account.accountInfo.name}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ETH Balance</p>
                                                <div className="flex items-center space-x-1">
                                                    <Coins className="h-3 w-3 text-gray-500" />
                                                    <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{parseFloat(account.ethBalance).toFixed(4)} ETH</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created At</p>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{account.accountInfo.establishedAt}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transfer Funds */}
            {accounts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Transfer Funds</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Transfer Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transfer Direction</label>
                                <select
                                    value={transferDirection}
                                    onChange={(e) => setTransferDirection(e.target.value as 'EOA_TO_TBA' | 'TBA_TO_EOA')}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                >
                                    <option value="EOA_TO_TBA">Wallet → TBA</option>
                                    <option value="TBA_TO_EOA">TBA → Wallet</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Token Type</label>
                                <select
                                    value={transferType}
                                    onChange={(e) => setTransferType(e.target.value as 'ETH' | 'ERC20')}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                >
                                    <option value="ETH">ETH</option>
                                    <option value="ERC20">ERC20</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Select TBA</label>
                            <select
                                value={selectedTBA}
                                onChange={(e) => setSelectedTBA(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                            >
                                <option value="">Select TBA...</option>
                                {accounts.map((account) => (
                                    <option key={account.tokenId} value={account.tbaAddress}>
                                        {formatAddress(account.tbaAddress, 15)} (Token #{account.tokenId})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {transferType === 'ERC20' && (
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ERC20 Contract Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={erc20Address}
                                    onChange={(e) => setErc20Address(e.target.value)}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</label>
                            <input
                                type="text"
                                placeholder={transferType === 'ETH' ? '0.001' : '100'}
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                            />
                        </div>

                        {/* Transfer Status */}
                        {transferStatus.status !== 'idle' && (
                            <div className="border border-gray-200 dark:border-gray-800 rounded p-4 bg-gray-50 dark:bg-gray-900">
                                {transferStatus.status === 'transferring' && (
                                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300"></div>
                                        <span className="text-sm font-mono">Processing transfer...</span>
                                    </div>
                                )}

                                {transferStatus.status === 'success' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                                            <ArrowUpDown className="h-4 w-4" />
                                            <span className="text-sm font-medium">Transfer Successful!</span>
                                        </div>
                                        <p><span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction:</span>
                                            <a
                                                href={getBlockExplorerUrl(chain?.id!, transferStatus.txHash || '')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-mono ml-1 underline"
                                            >
                                                {transferStatus.txHash?.slice(0, 10)}...
                                            </a>
                                        </p>
                                    </div>
                                )}

                                {transferStatus.status === 'error' && (
                                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                        <ArrowUpDown className="h-4 w-4" />
                                        <span className="text-sm font-mono">{transferStatus.error}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <Button
                                onClick={executeTransfer}
                                disabled={
                                    transferStatus.status === 'transferring' ||
                                    !selectedTBA ||
                                    !transferAmount ||
                                    (transferType === 'ERC20' && !erc20Address)
                                }
                                className="flex-1"
                            >
                                {transferStatus.status === 'transferring' ? 'Transferring...' : 'Execute Transfer'}
                            </Button>

                            {transferStatus.status !== 'idle' && transferStatus.status !== 'transferring' && (
                                <Button
                                    variant="outline"
                                    onClick={resetTransferStatus}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono space-y-1 leading-relaxed">
                            <p>• Transfer ETH or ERC20 tokens between your wallet and TBA</p>
                            <p>• TBA transfers require the AccountNFT owner to sign</p>
                            <p>• Make sure you have sufficient balance and gas fees</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 