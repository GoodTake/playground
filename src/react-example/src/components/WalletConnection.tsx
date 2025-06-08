import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export function WalletConnection() {
    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-mono leading-relaxed">
                        Connect your wallet to interact with GoTake SDK
                    </p>
                    <ConnectButton />
                </div>
            </CardContent>
        </Card>
    )
} 