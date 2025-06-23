
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
    return (
        <header className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/80">
            <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">GoTake SDK</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wide">React Example</span>
                </div>
                <ConnectButton />
            </div>
        </header>
    )
} 