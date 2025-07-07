import { GoTakeSDK } from '@gotake/gotake-sdk'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { formatAddress } from '../lib/utils'
import { Plus, Coins, RefreshCw, ArrowUpDown, Wallet } from 'lucide-react'
import { getBlockExplorerUrl } from '../lib/network-utils'
import { useTBAManager } from '../hooks/useTBAManager'

interface TBAManagerProps {
    sdk: GoTakeSDK
}

export function TBAManager({ sdk }: TBAManagerProps) {
    const { chain } = useAccount()

    const {
        // State
        accounts,
        loading,
        createStatus,
        transferStatus,
        transferForm,

        // Actions
        createAccount,
        refreshAccounts,
        transferFunds,
        updateTransferForm,
        resetCreateStatus,
        resetTransferStatus,
    } = useTBAManager(sdk)

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
                            onClick={createAccount}
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
                        onClick={refreshAccounts}
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
                                    value={transferForm.direction}
                                    onChange={(e) => updateTransferForm({ direction: e.target.value as 'EOA_TO_TBA' | 'TBA_TO_EOA' })}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                >
                                    <option value="EOA_TO_TBA">Wallet → TBA</option>
                                    <option value="TBA_TO_EOA">TBA → Wallet</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Token Type</label>
                                <select
                                    value={transferForm.type}
                                    onChange={(e) => updateTransferForm({ type: e.target.value as 'ETH' | 'ERC20' })}
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
                                value={transferForm.selectedTBA}
                                onChange={(e) => updateTransferForm({ selectedTBA: e.target.value })}
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

                        {transferForm.type === 'ERC20' && (
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ERC20 Contract Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={transferForm.erc20Address}
                                    onChange={(e) => updateTransferForm({ erc20Address: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-950 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</label>
                            <input
                                type="text"
                                placeholder={transferForm.type === 'ETH' ? '0.001' : '100'}
                                value={transferForm.amount}
                                onChange={(e) => updateTransferForm({ amount: e.target.value })}
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
                                onClick={transferFunds}
                                disabled={
                                    transferStatus.status === 'transferring' ||
                                    !transferForm.selectedTBA ||
                                    !transferForm.amount ||
                                    (transferForm.type === 'ERC20' && !transferForm.erc20Address)
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