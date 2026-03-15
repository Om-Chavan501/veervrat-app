import { forwardRef } from 'react'
import { cn } from './index'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-sage-500 text-white hover:bg-sage-600 focus:ring-sage-400 active:bg-sage-700',
      secondary:
        'bg-warm-100 text-stone-700 hover:bg-warm-200 focus:ring-warm-300 border border-warm-200',
      ghost:
        'text-stone-600 hover:bg-warm-100 focus:ring-warm-200',
      danger:
        'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
      outline:
        'border border-sage-400 text-sage-600 hover:bg-sage-50 focus:ring-sage-300',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
