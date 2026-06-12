import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            // Variants
            'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/30':
              variant === 'primary',
            'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700':
              variant === 'secondary',
            'bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white':
              variant === 'outline',
            'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200':
              variant === 'ghost',
            'backdrop-blur-md bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20':
              variant === 'glass',
            
            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
