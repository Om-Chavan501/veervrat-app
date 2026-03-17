import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-warm-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-stone-400 dark:text-stone-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-stone-700 dark:text-stone-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
