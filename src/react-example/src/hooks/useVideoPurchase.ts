import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { GoTakeSDK } from '@gotake/gotake-sdk';
import { useERC20 } from './useERC20';
import { batchFormatTokenAmountsWithSymbol } from '../lib/token-utils';

export interface ContentInfo {
    contentId: number;
    isActive: boolean;
    viewCount: number;
    nativePrice: string;
    rawNativePrice: ethers.BigNumber;
    tokenPrices: Record<string, string>;
    rawTokenPrices: Record<string, ethers.BigNumber>;
    userHasAccess: boolean;
    remainingViews?: number;
    purchaseTime?: Date;
    isExpired?: boolean;
}

export interface PurchaseState {
    step: 'input' | 'info' | 'processing' | 'complete';
    contentId: string;
    contentInfo: ContentInfo | null;
    selectedPaymentMethod: 'ETH' | 'ERC20';
    selectedTokenAddress?: string;
    loading: boolean;
    error: string | null;
    txHash?: string;
    approveHash?: string;
    currentOperation?: 'approve' | 'purchase';
}

export interface VideoPurchaseHook {
    // State
    step: PurchaseState['step'];
    contentId: string;
    contentInfo: ContentInfo | null;
    selectedPaymentMethod: 'ETH' | 'ERC20';
    selectedTokenAddress?: string;
    loading: boolean;
    error: string | null;
    txHash?: string;
    approveHash?: string;
    currentOperation?: 'approve' | 'purchase';

    // Actions
    setContentId: (id: string) => void;
    queryContent: () => Promise<void>;
    selectPaymentMethod: (method: 'ETH' | 'ERC20', tokenAddress?: string) => void;
    purchase: () => Promise<void>;
    reset: () => void;
    clearError: () => void;
    goBackToInput: () => void;
}

/**
 * Hook for managing video content purchase flow
 * Handles content querying, payment method selection, and purchase execution
 */
export const useVideoPurchase = (sdk: GoTakeSDK | null): VideoPurchaseHook => {
    const [state, setState] = useState<PurchaseState>({
        step: 'input',
        contentId: '',
        contentInfo: null,
        selectedPaymentMethod: 'ETH',
        loading: false,
        error: null,
    });

    // ERC20 hook for token operations
    const erc20Hook = useERC20(state.selectedTokenAddress || null, sdk);

    // Get VideoPayment contract address
    const getVideoPaymentContractAddress = useCallback(async (): Promise<string> => {
        if (!sdk) throw new Error('SDK not available');

        await sdk.videoPayment.init();
        const wrapper = (sdk.videoPayment as any)._videoPaymentWrapper;

        if (wrapper && wrapper.getContractAddress) {
            return wrapper.getContractAddress('videoPayment');
        }

        const contractInstance = (sdk.videoPayment as any).contract;
        if (contractInstance && contractInstance.address) {
            return contractInstance.address;
        }

        throw new Error('Unable to get VideoPayment contract address');
    }, [sdk]);

    // Set content ID
    const setContentId = useCallback((id: string) => {
        setState(prev => ({ ...prev, contentId: id }));
    }, []);

    // Query content information
    const queryContent = useCallback(async () => {
        if (!state.contentId.trim() || !sdk) {
            setState(prev => ({
                ...prev,
                error: 'Please enter a valid content ID'
            }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const contentId = parseInt(state.contentId);
            if (isNaN(contentId)) {
                throw new Error('Please provide a valid content ID');
            }

            const rawInfo = await sdk.videoPayment.getContentInfo(contentId);

            if (!rawInfo.isActive) {
                throw new Error('This content is not available for purchase');
            }

            // Check if user already has access
            const hasAccess = await sdk.videoPayment.hasViewPermission(contentId);

            let remainingViews = 0;
            let purchaseTime: Date | undefined;
            let isExpired = true;

            if (hasAccess) {
                try {
                    const permissions = await sdk.videoPayment.getMyPermissions(contentId);
                    remainingViews = permissions.remainingViews.toNumber();
                    purchaseTime = new Date(permissions.purchaseTime.toNumber() * 1000);
                    isExpired = !permissions.isValid;
                } catch (error) {
                    // If getMyPermissions fails, set default values
                    remainingViews = 0;
                    isExpired = true;
                }
            }

            // Format token prices using SDK utilities
            const formattedTokenPrices = await batchFormatTokenAmountsWithSymbol(
                rawInfo.tokenPrices || {},
                sdk.provider
            );

            const contentInfo: ContentInfo = {
                contentId,
                isActive: rawInfo.isActive,
                viewCount: rawInfo.viewCount,
                nativePrice: ethers.utils.formatEther(rawInfo.nativePrice),
                rawNativePrice: rawInfo.nativePrice,
                tokenPrices: formattedTokenPrices,
                rawTokenPrices: rawInfo.tokenPrices || {},
                userHasAccess: hasAccess,
                remainingViews,
                purchaseTime,
                isExpired,
            };

            setState(prev => ({
                ...prev,
                contentInfo,
                step: 'info',
                loading: false,
            }));

        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to query content information',
            }));
        }
    }, [state.contentId, sdk]);

    // Select payment method
    const selectPaymentMethod = useCallback((method: 'ETH' | 'ERC20', tokenAddress?: string) => {
        setState(prev => ({
            ...prev,
            selectedPaymentMethod: method,
            selectedTokenAddress: tokenAddress,
        }));
    }, []);

    // Execute purchase
    const purchase = useCallback(async () => {
        if (!state.contentInfo || !sdk) return;

        setState(prev => ({
            ...prev,
            loading: true,
            error: null,
            currentOperation: 'purchase',
            step: 'processing'
        }));

        try {
            const { contentId } = state.contentInfo;

            // Get optimal gas configuration
            const gasPrices = await sdk.getGasPrice({
                multiplier: 1.2,
                priorityMultiplier: 1.1
            });

            const gasConfig = {
                maxFeePerGas: gasPrices.maxFeePerGas,
                maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas
            };

            let result: any;

            if (state.selectedPaymentMethod === 'ETH') {
                result = await sdk.videoPayment.purchaseContent(contentId, 'ETH', undefined, {
                    gasConfig
                });
            } else {
                // ERC20 purchase
                if (!state.selectedTokenAddress) {
                    throw new Error('Token address not selected');
                }

                const tokenAddress = state.selectedTokenAddress;
                const requiredAmount = state.contentInfo.rawTokenPrices[tokenAddress];

                if (!requiredAmount) {
                    throw new Error('Price data not available for selected token');
                }

                // Get VideoPayment contract address
                const spenderAddress = await getVideoPaymentContractAddress();

                // Check allowance
                const userAddress = await sdk.getAddress();
                const allowance = await erc20Hook.checkAllowance(userAddress, spenderAddress);

                if (!allowance || allowance.lt(requiredAmount)) {
                    // Need to approve
                    setState(prev => ({ ...prev, currentOperation: 'approve' }));

                    const approveTx = await erc20Hook.approve(spenderAddress, requiredAmount);
                    if (!approveTx) {
                        throw new Error('Failed to approve token spend');
                    }

                    setState(prev => ({ ...prev, approveHash: approveTx.hash }));
                    await approveTx.wait();
                }

                // Execute purchase
                setState(prev => ({ ...prev, currentOperation: 'purchase' }));

                result = await sdk.videoPayment.purchaseContent(contentId, 'ERC20', tokenAddress, {
                    gasConfig
                });
            }

            setState(prev => ({
                ...prev,
                loading: false,
                txHash: result.transactionHash,
                step: 'complete',
                currentOperation: undefined,
            }));

        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : 'Purchase failed';

            // Simplify error messages for better UX
            if (errorMessage.length > 150) {
                if (errorMessage.includes('gas')) {
                    errorMessage = 'Gas estimation failed. Please check your network connection and ETH balance.';
                } else if (errorMessage.includes('allowance') || errorMessage.includes('approve')) {
                    errorMessage = 'Token approval failed. Please try again.';
                } else {
                    errorMessage = 'Transaction failed. Please check your network and balance.';
                }
            }

            setState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                step: 'info',
                currentOperation: undefined,
            }));
        }
    }, [state.contentInfo, state.selectedPaymentMethod, state.selectedTokenAddress, sdk, erc20Hook, getVideoPaymentContractAddress]);

    // Reset purchase flow
    const reset = useCallback(() => {
        setState({
            step: 'input',
            contentId: '',
            contentInfo: null,
            selectedPaymentMethod: 'ETH',
            loading: false,
            error: null,
            txHash: undefined,
            approveHash: undefined,
            currentOperation: undefined,
        });
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Go back to input step
    const goBackToInput = useCallback(() => {
        setState(prev => ({
            ...prev,
            step: 'input',
            contentInfo: null,
            error: null
        }));
    }, []);

    return {
        // State
        step: state.step,
        contentId: state.contentId,
        contentInfo: state.contentInfo,
        selectedPaymentMethod: state.selectedPaymentMethod,
        selectedTokenAddress: state.selectedTokenAddress,
        loading: state.loading,
        error: state.error,
        txHash: state.txHash,
        approveHash: state.approveHash,
        currentOperation: state.currentOperation,

        // Actions
        setContentId,
        queryContent,
        selectPaymentMethod,
        purchase,
        reset,
        clearError,
        goBackToInput,
    };
}; 