import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export function WalletConnection() {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Connect your wallet to interact with GoTake SDK
                    </p>
                    <ConnectButton />
                </div>
            </CardContent>
        </Card>
    )
} 