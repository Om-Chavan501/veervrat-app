import { cn } from './index'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 'md', className, label = 'Loading...' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-stone-200 border-t-sage-500 animate-spin',
          sizes[size]
        )}
        style={{ borderWidth: size === 'md' ? '3px' : undefined }}
        role="status"
        aria-label={label}
      />
      {size === 'lg' && <p className="text-sm text-stone-500 animate-pulse">{label}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  )
}
