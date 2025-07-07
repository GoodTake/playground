import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { GoTakeSDK } from '@gotake/gotake-sdk';
import { AccountNFTInfo, CreateAccountStatus, TransferStatus, TransferForm } from '../types/tba';

export interface TBAManagerHook {
    // State
    accounts: AccountNFTInfo[];
    loading: boolean;
    createStatus: CreateAccountStatus;
    transferStatus: TransferStatus;
    transferForm: TransferForm;

    // Actions
    createAccount: () => Promise<void>;
    refreshAccounts: () => Promise<void>;
    transferFunds: () => Promise<void>;
    updateTransferForm: (updates: Partial<TransferForm>) => void;
    resetCreateStatus: () => void;
    resetTransferStatus: () => void;
}

/**
 * Hook for managing TBA (Token Bound Account) operations
 * Handles account creation, transfers, and account data management
 */
export const useTBAManager = (sdk: GoTakeSDK | null): TBAManagerHook => {
    const [accounts, setAccounts] = useState<AccountNFTInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [createStatus, setCreateStatus] = useState<CreateAccountStatus>({ status: 'idle' });
    const [transferStatus, setTransferStatus] = useState<TransferStatus>({ status: 'idle' });
    const [transferForm, setTransferForm] = useState<TransferForm>({
        direction: 'EOA_TO_TBA',
        type: 'ETH',
        amount: '',
        selectedTBA: '',
        erc20Address: '',
    });



    // Fetch user's AccountNFTs and their TBAs
    const refreshAccounts = useCallback(async () => {
        setLoading(true);
        try {
            // For now, we'll check if user has any AccountNFT by trying to create one
            // In a real implementation, you'd query the AccountNFT contract for user's tokens
            // This is a simplified approach for the demo
            setAccounts([]);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch detailed account information
    const fetchAccountDetails = useCallback(async (tokenId: string, tbaAddress: string) => {
        if (!sdk) return;

        try {
            const userAddress = await sdk.getAddress();

            // Get TBA ETH balance
            const ethBalance = await sdk.provider.getBalance(tbaAddress);
            const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);

            // Get account info from AccountNFT
            const accountInfo = await sdk.account.getAccountInfo(tokenId);

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
            };

            setAccounts(prev => {
                const existing = prev.find(acc => acc.tokenId === tokenId);
                if (existing) {
                    return prev.map(acc => acc.tokenId === tokenId ? accountData : acc);
                } else {
                    return [...prev, accountData];
                }
            });

        } catch (error) {
            console.error('Error fetching account details:', error);
        }
    }, [sdk]);

    // Create new user account (AccountNFT + TBA)
    const createAccount = useCallback(async () => {
        if (!sdk) return;

        setCreateStatus({ status: 'creating' });

        try {
            const userAddress = await sdk.getAddress();

            console.log('Creating new user account...');

            const result = await sdk.account.createNewUserAccount({
                recipientAddress: userAddress,
                accountNFTMetadata: {
                    uri: `account://${userAddress}/metadata`
                },
                tbaConfig: {
                    salt: '0x0000000000000000000000000000000000000000000000000000000000000000'
                }
            });

            console.log('Account creation result:', result);

            // Wait for transactions to be mined
            const accountNFTReceipt = await result.accountNFT.tx.wait();
            const tbaReceipt = await result.tba.tx.wait();

            setCreateStatus({
                status: 'success',
                accountNFTTx: accountNFTReceipt.transactionHash,
                tbaTx: tbaReceipt.transactionHash,
                tokenId: result.accountNFT.tokenId.toString(),
                tbaAddress: result.tba.tbaAddress
            });

            // Wait for next block before querying account details
            const currentBlock = await sdk.provider.getBlockNumber();
            const targetBlock = currentBlock + 1;

            // Wait for target block
            await new Promise((resolve) => {
                const checkBlock = async () => {
                    const latestBlock = await sdk.provider.getBlockNumber();
                    if (latestBlock >= targetBlock) {
                        resolve(undefined);
                    } else {
                        setTimeout(checkBlock, 1000); // Check every second
                    }
                };
                checkBlock();
            });

            // Now fetch account details
            try {
                await fetchAccountDetails(result.accountNFT.tokenId.toString(), result.tba.tbaAddress);
            } catch (error) {
                console.warn('Failed to fetch account details after creation, but account was created successfully:', error);
            }

        } catch (error) {
            console.error('Error creating account:', error);
            setCreateStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to create account'
            });
        }
    }, [sdk, fetchAccountDetails]);

    // Execute transfer between EOA and TBA
    const transferFunds = useCallback(async () => {
        if (!transferForm.selectedTBA || !transferForm.amount || !sdk) {
            return;
        }

        setTransferStatus({ status: 'transferring' });

        try {
            const userAddress = await sdk.getAddress();
            let txHash: string;

            if (transferForm.type === 'ETH') {
                if (transferForm.direction === 'EOA_TO_TBA') {
                    // Send ETH from EOA to TBA
                    const tx = await sdk.signer.sendTransaction({
                        to: transferForm.selectedTBA,
                        value: ethers.utils.parseEther(transferForm.amount)
                    });
                    const receipt = await tx.wait();
                    txHash = receipt.transactionHash;
                } else {
                    // Send ETH from TBA to EOA
                    const result = await sdk.account.executeTBATransaction({
                        accountAddress: transferForm.selectedTBA,
                        to: userAddress,
                        value: ethers.utils.parseEther(transferForm.amount),
                        data: '0x'
                    });
                    const receipt = await result.tx.wait();
                    txHash = receipt.transactionHash;
                }
            } else {
                // ERC20 transfer
                if (!transferForm.erc20Address) {
                    throw new Error('ERC20 contract address is required');
                }

                const erc20Interface = new ethers.utils.Interface([
                    'function transfer(address to, uint256 amount) returns (bool)',
                    'function transferFrom(address from, address to, uint256 amount) returns (bool)'
                ]);

                if (transferForm.direction === 'EOA_TO_TBA') {
                    // Transfer ERC20 from EOA to TBA
                    const erc20Contract = new ethers.Contract(transferForm.erc20Address, [
                        'function transfer(address to, uint256 amount) returns (bool)',
                        'function decimals() view returns (uint8)'
                    ], sdk.signer);

                    const decimals = await erc20Contract.decimals();
                    const amount = ethers.utils.parseUnits(transferForm.amount, decimals);

                    const tx = await erc20Contract.transfer(transferForm.selectedTBA, amount);
                    const receipt = await tx.wait();
                    txHash = receipt.transactionHash;
                } else {
                    // Transfer ERC20 from TBA to EOA
                    const erc20Contract = new ethers.Contract(transferForm.erc20Address, [
                        'function decimals() view returns (uint8)'
                    ], sdk.provider);

                    const decimals = await erc20Contract.decimals();
                    const amount = ethers.utils.parseUnits(transferForm.amount, decimals);

                    const transferData = erc20Interface.encodeFunctionData('transfer', [userAddress, amount]);

                    const result = await sdk.account.executeTBATransaction({
                        accountAddress: transferForm.selectedTBA,
                        to: transferForm.erc20Address,
                        value: 0,
                        data: transferData
                    });
                    const receipt = await result.tx.wait();
                    txHash = receipt.transactionHash;
                }
            }

            setTransferStatus({
                status: 'success',
                txHash
            });

            // Reset form
            setTransferForm(prev => ({
                ...prev,
                amount: '',
                erc20Address: ''
            }));

            // Refresh account details
            const account = accounts.find(acc => acc.tbaAddress === transferForm.selectedTBA);
            if (account) {
                await fetchAccountDetails(account.tokenId, account.tbaAddress);
            }

        } catch (error) {
            console.error('Error executing transfer:', error);
            setTransferStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Transfer failed'
            });
        }
    }, [transferForm, sdk, accounts, fetchAccountDetails]);

    // Update transfer form
    const updateTransferForm = useCallback((updates: Partial<TransferForm>) => {
        setTransferForm(prev => ({ ...prev, ...updates }));
    }, []);

    // Reset status functions
    const resetCreateStatus = useCallback(() => {
        setCreateStatus({ status: 'idle' });
    }, []);

    const resetTransferStatus = useCallback(() => {
        setTransferStatus({ status: 'idle' });
    }, []);

    // Initialize accounts on mount
    useEffect(() => {
        if (sdk) {
            refreshAccounts();
        }
    }, [sdk, refreshAccounts]);

    return {
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
    };
}; 