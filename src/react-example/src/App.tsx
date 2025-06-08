import React from 'react'
import { useAccount } from 'wagmi'
import { WalletConnection } from './components/WalletConnection'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'

function App() {
    const { isConnected } = useAccount()

    return (
        <div className="dark min-h-screen bg-gray-950 text-gray-100">
            <Header />
            <main className="container mx-auto px-6 py-8">
                {isConnected ? <Dashboard /> : <WalletConnection />}
            </main>
        </div>
    )
}

export default App
