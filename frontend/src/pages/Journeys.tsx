import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, ArrowRight } from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import type { JourneyState } from '../types'

const FILTERS = [
  { value: 'ALL' as const, label: 'All' },
  { value: 'ACTIVE' as const, label: 'Active' },
  { value: 'INACTIVE' as const, label: 'Paused' },
  { value: 'COMPLETED' as const, label: 'Completed' },
]

const stateConfig: Record<JourneyState, { label: string; variant: 'success' | 'warning' | 'info'; dot: string }> = {
  ACTIVE: { label: 'Active', variant: 'success', dot: 'bg-emerald-400' },
  INACTIVE: { label: 'Paused', variant: 'warning', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', variant: 'info', dot: 'bg-blue-400' },
}

export function Journeys() {
  const [filter, setFilter] = useState<JourneyState | 'ALL'>('ALL')

  const { data: journeys, isLoading } = useQuery({
    queryKey: ['journeys', filter === 'ALL' ? undefined : filter],
    queryFn: () => journeysApi.list(filter === 'ALL' ? undefined : filter),
  })

  if (isLoading) return <PageLoader />

  const counts = journeys?.reduce((acc, j) => {
    acc[j.state] = (acc[j.state] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">My Journeys</h1>
        <p className="text-stone-500 mt-1 text-sm">
          {journeys?.length ?? 0} journey{(journeys?.length ?? 0) !== 1 ? 's' : ''} across all states
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => {
          const count = value === 'ALL' ? (journeys?.length ?? 0) : (counts[value] ?? 0)
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl font-medium transition-all ${
                filter === value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'bg-white border border-warm-200 text-stone-600 hover:border-warm-300 hover:bg-warm-50'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === value ? 'bg-white/20 text-white' : 'bg-warm-100 text-stone-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Journey list */}
      {journeys && journeys.length > 0 ? (
        <div className="space-y-2.5">
          {journeys.map((journey) => {
            const config = stateConfig[journey.state]
            return (
              <Link key={journey.id} to={`/journeys/${journey.id}`}>
                <div className="bg-white rounded-2xl border border-warm-200 p-4 hover:border-sage-200 hover:shadow-card-hover transition-all cursor-pointer group flex items-start gap-3.5">
                  {/* State dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Sub-virtue + virtue breadcrumb */}
                    {journey.sentence?.sub_virtue && (
                      <div className="flex items-center gap-1 mb-1.5">
                        {journey.sentence.sub_virtue.virtue && (
                          <>
                            <span className="text-xs text-stone-400">{journey.sentence.sub_virtue.virtue.name_en}</span>
                            <span className="text-stone-300 text-xs">›</span>
                          </>
                        )}
                        <span className="text-xs font-medium text-stone-500">{journey.sentence.sub_virtue.name_en}</span>
                      </div>
                    )}

                    <p className="text-sm font-semibold text-stone-800 leading-snug mb-1.5">
                      {journey.sentence?.text_en}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                      <span className="text-xs text-stone-400">
                        {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
                      </span>
                      {journey.inactive_at && (
                        <span className="text-xs text-stone-400">
                          · paused {formatDistanceToNow(new Date(journey.inactive_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight size={15} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No journeys found"
          description={
            filter !== 'ALL'
              ? `No ${filter.toLowerCase()} journeys. Try a different filter.`
              : 'Complete an assessment to start your first journey.'
          }
        />
      )}
    </div>
  )
}
