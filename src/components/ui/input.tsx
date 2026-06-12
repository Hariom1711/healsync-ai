import * as React from 'react'
import { clsx } from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={clsx(
          'w-full rounded-lg bg-slate-900/60 border border-slate-700/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:pointer-events-none disabled:opacity-50',
          {
            'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
          },
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
