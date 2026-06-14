import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'dark' | 'tan'
}

export default function GameButton({ variant, className = '', children, ...props }: Props) {
  return (
    <button
      className={`game-btn-${variant} uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
