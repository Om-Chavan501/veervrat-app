import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2 } from 'lucide-react'
import { cn } from './ui'
import * as usersApi from '../api/users'
import type { UserSearchItem } from '../api/users'

interface Props {
  onSelect: (user: UserSearchItem) => void
  placeholder?: string
}

export function UserSearchCombobox({ onSelect, placeholder = 'Search by name or email...' }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => usersApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleSelect(user: UserSearchItem) {
    onSelect(user)
    setQuery('')
    setDebouncedQuery('')
    setOpen(false)
  }

  const showDropdown = open && debouncedQuery.length >= 2

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
        {isFetching && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-stone-800 border border-warm-200 dark:border-stone-700 rounded-lg shadow-lg overflow-hidden">
          {results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={() => handleSelect(user)}
                className={cn(
                  'w-full text-left px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors',
                  'border-b border-warm-100 dark:border-stone-700/50 last:border-b-0'
                )}
              >
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">{user.email}</p>
                )}
              </button>
            ))
          ) : !isFetching ? (
            <div className="px-3 py-3 text-sm text-stone-400 dark:text-stone-500">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
