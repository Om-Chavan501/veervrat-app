import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, ArrowRight, Filter } from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import type { JourneyState } from '../types'

const stateConfig: Record<JourneyState, { label: string; variant: string }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Paused', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'info' },
}

export function Journeys() {
  const [filter, setFilter] = useState<JourneyState | 'ALL'>('ALL')

  const { data: journeys, isLoading } = useQuery({
    queryKey: ['journeys', filter === 'ALL' ? undefined : filter],
    queryFn: () => journeysApi.list(filter === 'ALL' ? undefined : filter),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Journeys</h1>
          <p className="text-stone-500 mt-1 text-sm">
            Your active and completed sentence practice journeys
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-stone-400" />
        {(['ALL', 'ACTIVE', 'INACTIVE', 'COMPLETED'] as const).map((state) => (
          <button
            key={state}
            onClick={() => setFilter(state)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === state
                ? 'bg-sage-500 text-white'
                : 'bg-white border border-warm-200 text-stone-600 hover:bg-warm-50'
            }`}
          >
            {state === 'ALL' ? 'All' : stateConfig[state].label}
          </button>
        ))}
      </div>

      {/* Journey list */}
      {journeys && journeys.length > 0 ? (
        <div className="space-y-3">
          {journeys.map((journey) => {
            const config = stateConfig[journey.state]
            return (
              <Link key={journey.id} to={`/journeys/${journey.id}`}>
                <Card
                  padding="md"
                  className="hover:border-sage-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Route size={18} className="text-sage-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant={config.variant as 'success' | 'warning' | 'info'}>
                          {config.label}
                        </Badge>
                        {journey.sentence?.sub_virtue && (
                          <Badge variant="muted">{journey.sentence.sub_virtue.name_en}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-stone-800 leading-snug mb-1">
                        {journey.sentence?.text_en}
                      </p>
                      <p className="text-xs text-stone-500">
                        Started {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
                        {journey.inactive_at &&
                          ` · Paused ${formatDistanceToNow(new Date(journey.inactive_at), { addSuffix: true })}`}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-2"
                    />
                  </div>
                </Card>
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
