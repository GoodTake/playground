import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold">GoTake SDK</h1>
                    <span className="text-sm text-muted-foreground">React Example</span>
                </div>
                <ConnectButton />
            </div>
        </header>
    )
} 