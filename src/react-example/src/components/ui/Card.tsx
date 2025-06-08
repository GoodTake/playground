import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
}

interface CardHeaderProps {
    children: React.ReactNode
    className?: string
}

interface CardContentProps {
    children: React.ReactNode
    className?: string
}

interface CardTitleProps {
    children: React.ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`rounded border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`flex flex-col space-y-2 p-4 ${className}`}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
    return (
        <h3 className={`text-lg font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
            {children}
        </h3>
    )
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return (
        <div className={`p-4 pt-0 ${className}`}>
            {children}
        </div>
    )
} 