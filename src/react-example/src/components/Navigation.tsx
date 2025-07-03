import React from 'react'
import { Wallet, Hash, Video, Shield, Settings, ChevronRight } from 'lucide-react'

interface NavigationItem {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
}

interface NavigationGroup {
    title: string
    items: NavigationItem[]
}

interface NavigationProps {
    activeItem: string
    onItemChange: (itemId: string) => void
}

const navigationGroups: NavigationGroup[] = [
    {
        title: 'Wallet Management',
        items: [
            {
                id: 'wallet',
                label: 'Wallet Info',
                icon: Wallet,
                description: 'View wallet balance and information'
            }
        ]
    },
    {
        title: 'Account Management',
        items: [
            {
                id: 'tba',
                label: 'Account Manager',
                icon: Hash,
                description: 'Create accounts and manage funds'
            }
        ]
    },
    {
        title: 'Video Content',
        items: [
            {
                id: 'video-purchase',
                label: 'Video Purchase',
                icon: Video,
                description: 'Purchase video content with ETH or tokens'
            },
            {
                id: 'permissions',
                label: 'Permission Manager',
                icon: Shield,
                description: 'View and manage content permissions'
            },
            {
                id: 'content-manager',
                label: 'Content Manager',
                icon: Settings,
                description: 'Admin: Manage content configuration'
            }
        ]
    }
]

export function Navigation({ activeItem, onItemChange }: NavigationProps) {
    return (
        <div className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    GoTake SDK
                </h2>

                <nav className="space-y-6">
                    {navigationGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                {group.title}
                            </h3>

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = activeItem === item.id

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onItemChange(item.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${isActive
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Icon className="h-4 w-4" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    )
} 