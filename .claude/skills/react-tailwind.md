# React + Tailwind skill — Veervrat frontend

## Component conventions
- Functional components only, named exports only
- Props interface defined above component: `interface JourneyCardProps { ... }`
- One component per file, PascalCase filename = component name
- Co-locate feature-specific components with their page when they're used
  in only one place

## Conditional classes — always use cn()
```tsx
import { cn } from '../lib/utils'  // or wherever cn is defined — check existing usage

<div className={cn(
  'base-classes-always-present',
  isActive && 'conditional-class',
  variant === 'primary' ? 'text-white bg-indigo-600' : 'text-gray-700 bg-white'
)} />
```

## Tailwind patterns — match existing components in src/components/ui/

Look at existing ui/ components (Button, Card, Input, Badge, Modal) before
writing new ones — match their class patterns exactly.

Common patterns to follow:
- Responsive: mobile-first (`base → sm: → md: → lg:`)
- Focus: `focus:outline-none focus:ring-2 focus:ring-indigo-500`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Transitions: `transition-colors duration-150` (not duration-300)

## State management rules
```tsx
// Server state — ALWAYS React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['journeys'],
  queryFn: journeysApi.getAll,
})

const mutation = useMutation({
  mutationFn: journeysApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['journeys'] })
    toast.success('Journey created')
  },
  onError: () => toast.error('Something went wrong'),
})

// Auth state — ALWAYS Zustand (never put in React Query)
const { user, token, login, logout } = useAuthStore()
```

## API call pattern
```tsx
// In src/api/journeys.ts — typed async functions
export const journeysApi = {
  getAll: (): Promise<Journey[]> => 
    client.get('/journeys').then(r => r.data),
  
  getById: (id: string): Promise<Journey> =>
    client.get(`/journeys/${id}`).then(r => r.data),
  
  create: (payload: CreateJourneyPayload): Promise<Journey> =>
    client.post('/journeys', payload).then(r => r.data),
}

// NEVER call client directly inside a component or hook
// NEVER use fetch() anywhere
```

## Notifications
```tsx
import toast from 'react-hot-toast'

toast.success('Saved')
toast.error('Failed to save')
toast.loading('Saving...')  // returns id for toast.dismiss(id)
```

## Icons
```tsx
import { BookOpen, ChevronRight, Plus } from 'lucide-react'
// lucide-react only — no other icon libraries
// Standard size: className="h-4 w-4" for inline, "h-5 w-5" for buttons
```

## i18n
```tsx
const { t } = useLanguage()  // from LanguageContext
<h1>{t('dashboard.title')}</h1>
// Add new keys to src/i18n/translations.ts for both languages
```

## Loading and empty states
```tsx
// Use existing UI components
import { LoadingSpinner, EmptyState } from '../components/ui'

if (isLoading) return <LoadingSpinner />
if (!data?.length) return <EmptyState message="No journeys yet" />
```

## Page structure pattern
```tsx
// Standard page layout
export function JourneysPage() {
  const { data, isLoading } = useQuery({ ... })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Journeys
        </h1>
        <Button onClick={...}>
          <Plus className="h-4 w-4 mr-2" /> New Journey
        </Button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid gap-4">
          {data?.map(j => <JourneyCard key={j.id} journey={j} />)}
        </div>
      )}
    </div>
  )
}
```
