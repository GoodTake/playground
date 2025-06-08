import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg'
}

const buttonVariants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 border border-transparent',
    outline: 'border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-transparent dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-transparent dark:text-gray-300 dark:hover:bg-gray-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent'
}

const buttonSizes = {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 px-3 py-1.5 text-xs',
    lg: 'h-10 px-6 py-2.5 text-base'
}

export function Button({
    className = '',
    variant = 'default',
    size = 'default',
    children,
    ...props
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none'
    const variantClasses = buttonVariants[variant]
    const sizeClasses = buttonSizes[size]

    return (
        <button
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
} 