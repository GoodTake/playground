import { useState, useEffect, useMemo } from 'react'
import { GoTakeSDK } from '@gotake/gotake-sdk'
import { useAccount, useWalletClient } from 'wagmi'
import { walletClientToSigner } from './walletClientToSigner'

export function useGoTakeSDK() {
    const { address, isConnected, chain } = useAccount()
    const { data: walletClient } = useWalletClient()
    const [sdk, setSDK] = useState<GoTakeSDK | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const networkName = useMemo(() => {
        if (!chain) return 'Base Sepolia'

        switch (chain.id) {
            case 84532: return 'Base Sepolia'
            case 8453: return 'Base Mainnet'
            case 1: return 'Ethereum Mainnet'
            case 11155111: return 'Ethereum Sepolia'
            default: return 'Base Sepolia'
        }
    }, [chain])

    useEffect(() => {
        const initializeSDK = async () => {
            if (!isConnected || !walletClient || !address) {
                setSDK(null)
                return
            }

            try {
                setLoading(true)
                setError(null)

                // Create ethers signer from wagmi wallet client
                const signer = walletClientToSigner(walletClient)

                // Initialize GoTake SDK with ethers signer
                const sdkInstance = new GoTakeSDK({
                    network: networkName,
                    signer: signer
                })

                setSDK(sdkInstance)
            } catch (err) {
                console.error('Failed to initialize SDK:', err)
                setError(err instanceof Error ? err.message : 'Failed to initialize SDK')
            } finally {
                setLoading(false)
            }
        }

        initializeSDK()
    }, [isConnected, walletClient, address, networkName])

    return {
        sdk,
        loading,
        error,
        isReady: !!sdk && isConnected,
        address,
        networkName
    }
} 