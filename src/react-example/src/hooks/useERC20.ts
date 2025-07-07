import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { GoTakeSDK } from '@gotake/gotake-sdk';

const erc20ABI = [
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
];

export interface ERC20Hook {
    loading: boolean;
    error: Error | null;
    approve: (spender: string, amount: ethers.BigNumber) => Promise<ethers.ContractTransaction | null>;
    checkAllowance: (owner: string, spender: string) => Promise<ethers.BigNumber | null>;
    getBalance: (owner: string) => Promise<ethers.BigNumber | null>;
    contract: ethers.Contract | null;
    clearError: () => void;
}

/**
 * Hook for interacting with ERC20 token contracts
 * Provides approve, allowance checking, and balance querying functionality
 */
export const useERC20 = (tokenAddress: string | null, sdk: GoTakeSDK | null): ERC20Hook => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const contract = useMemo(() => {
        if (!tokenAddress || !ethers.utils.isAddress(tokenAddress) || !sdk) {
            return null;
        }
        return new ethers.Contract(tokenAddress, erc20ABI, sdk.signer || sdk.provider);
    }, [tokenAddress, sdk]);

    const handleOperation = useCallback(
        async <T>(operation: () => Promise<T>, errorMessage: string): Promise<T | null> => {
            setLoading(true);
            setError(null);
            try {
                const result = await operation();
                return result;
            } catch (e) {
                const err = e instanceof Error ? e : new Error(errorMessage);
                console.error(errorMessage, err);
                setError(err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const approve = useCallback(
        (spender: string, amount: ethers.BigNumber) => {
            return handleOperation(async () => {
                if (!contract || !sdk?.signer) {
                    throw new Error('Contract or signer not available');
                }
                return contract.connect(sdk.signer).approve(spender, amount);
            }, 'Failed to approve token spend');
        },
        [contract, sdk, handleOperation]
    );

    const checkAllowance = useCallback(
        (owner: string, spender: string) => {
            return handleOperation(async () => {
                if (!contract) {
                    throw new Error('Contract not available');
                }
                return contract.allowance(owner, spender);
            }, 'Failed to check allowance');
        },
        [contract, handleOperation]
    );

    const getBalance = useCallback(
        (owner: string) => {
            return handleOperation(async () => {
                if (!contract) {
                    throw new Error('Contract not available');
                }
                return contract.balanceOf(owner);
            }, 'Failed to get balance');
        },
        [contract, handleOperation]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        approve,
        checkAllowance,
        getBalance,
        contract,
        clearError
    };
}; 