import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from './index'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full bg-white dark:bg-stone-900 rounded-2xl shadow-2xl animate-slide-up', sizes[size])}>
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-warm-100 dark:border-stone-700">
            <div>
              {title && <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h2>}
              {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-warm-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
