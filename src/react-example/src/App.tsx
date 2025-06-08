import React from 'react'
import { useAccount } from 'wagmi'
import { WalletConnection } from './components/WalletConnection'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'

function App() {
    const { isConnected } = useAccount()

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {isConnected ? <Dashboard /> : <WalletConnection />}
            </main>
        </div>
    )
}

export default App
