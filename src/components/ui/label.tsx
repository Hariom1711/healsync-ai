import * as React from 'react'
import { clsx } from 'clsx'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          'text-sm font-medium text-slate-300 select-none mb-1.5 block',
          className
        )}
        {...props}
      />
    )
  }
)

Label.displayName = 'Label'
