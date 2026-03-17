import { forwardRef } from 'react'
import { cn } from './index'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500',
            'focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent',
            'transition-colors duration-150',
            error
              ? 'border-red-300 focus:ring-red-400'
              : 'border-warm-200 dark:border-stone-600 hover:border-warm-300 dark:hover:border-stone-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500',
            'focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent',
            'transition-colors duration-150 resize-none',
            error
              ? 'border-red-300 focus:ring-red-400'
              : 'border-warm-200 dark:border-stone-600 hover:border-warm-300 dark:hover:border-stone-500',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
