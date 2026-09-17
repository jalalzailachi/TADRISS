// components/ui/Button.tsx
'use client'
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:   'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10',
    secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/10',
    ghost:     'text-outline hover:text-on-surface hover:bg-surface-container-low bg-transparent',
    danger:    'bg-error text-white hover:bg-error/90 shadow-lg shadow-error/10',
    success:   'bg-tertiary text-white hover:bg-tertiary/90 shadow-lg shadow-tertiary/10',
  }
  const sizes = {
    sm: 'text-[12px] h-8 px-3 rounded-[8px]',
    md: 'text-[13px] h-[40px] px-4 rounded-[10px]',
    lg: 'text-[14px] h-[44px] px-6 rounded-[10px]',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-bold
        transition-all duration-150 active:scale-[0.98]
        disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed
        ${variants[variant as keyof typeof variants] || variants.primary} 
        ${sizes[size as keyof typeof sizes] || sizes.md} 
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
}
