import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, ArrowRight } from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { useLanguage } from '../contexts/LanguageContext'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import type { JourneyState } from '../types'

export function Journeys() {
  const [filter, setFilter] = useState<JourneyState | 'ALL'>('ALL')
  const { t, lang } = useLanguage()

  const { data: journeys, isLoading } = useQuery({
    queryKey: ['journeys', filter === 'ALL' ? undefined : filter],
    queryFn: () => journeysApi.list(filter === 'ALL' ? undefined : filter),
  })

  const { data: counts } = useQuery({
    queryKey: ['journey-counts'],
    queryFn: journeysApi.counts,
  })

  if (isLoading) return <PageLoader />

  const total = (counts?.ACTIVE ?? 0) + (counts?.INACTIVE ?? 0) + (counts?.COMPLETED ?? 0)

  const FILTERS = [
    { value: 'ALL' as const, label: t('journeys.all') },
    { value: 'ACTIVE' as const, label: t('journeys.active') },
    { value: 'INACTIVE' as const, label: t('journeys.paused') },
    { value: 'COMPLETED' as const, label: t('journeys.completed') },
  ]

  const stateConfig: Record<JourneyState, { label: string; variant: 'success' | 'warning' | 'info'; dot: string }> = {
    ACTIVE: { label: t('journeys.stateActive'), variant: 'success', dot: 'bg-emerald-400' },
    INACTIVE: { label: t('journeys.statePaused'), variant: 'warning', dot: 'bg-amber-400' },
    COMPLETED: { label: t('journeys.stateCompleted'), variant: 'info', dot: 'bg-blue-400' },
  }

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('journeys.title')}</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
          {t('journeys.subtitle').replace('{count}', String(total)).replace('{plural}', total !== 1 ? 's' : '')}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => {
          const count = value === 'ALL' ? total : (counts?.[value] ?? 0)
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl font-medium transition-all ${
                filter === value
                  ? 'bg-stone-800 dark:bg-stone-700 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-warm-300 dark:hover:border-stone-600 hover:bg-warm-50 dark:hover:bg-stone-800'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${filter === value ? 'bg-white/20 text-white' : 'bg-warm-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {journeys && journeys.length > 0 ? (
        <div className="space-y-2.5">
          {journeys.map((journey, i) => {
            const config = stateConfig[journey.state]
            const staggerDelay = ['delay-[0ms]','delay-[75ms]','delay-[150ms]','delay-[225ms]','delay-[300ms]','delay-[375ms]']
            return (
              <Link key={journey.id} to={`/journeys/${journey.id}`} className={`block animate-enter ${staggerDelay[Math.min(i, 5)]}`}>
                <div className="bg-white dark:bg-[#231c17] rounded-2xl border border-warm-200 dark:border-[#3d3028] p-4 hover:border-sage-200 dark:hover:border-sage-800 hover:shadow-card-hover transition-all cursor-pointer group flex items-start gap-3.5">
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {journey.sentence?.sub_virtue && (
                      <div className="flex items-center gap-1 mb-1.5">
                        {journey.sentence.sub_virtue.virtue && (
                          <>
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {lang === 'mr' ? journey.sentence.sub_virtue.virtue.name_mr : journey.sentence.sub_virtue.virtue.name_en}
                            </span>
                            <span className="text-stone-300 dark:text-stone-600 text-xs">›</span>
                          </>
                        )}
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                          {lang === 'mr' ? journey.sentence.sub_virtue.name_mr : journey.sentence.sub_virtue.name_en}
                        </span>
                      </div>
                    )}
                    <p className="font-serif text-base text-stone-800 dark:text-[#ede8e0] leading-snug mb-1.5">
                      {lang === 'mr' ? journey.sentence?.text_mr : journey.sentence?.text_en}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
                      </span>
                      {journey.inactive_at && (
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          · {t('journeys.paused').toLowerCase()} {formatDistanceToNow(new Date(journey.inactive_at), { addSuffix: true })}
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
          title={t('journeys.none')}
          description={
            filter !== 'ALL'
              ? t('journeys.noneFiltered').replace('{filter}', filter.toLowerCase())
              : t('journeys.noneAll')
          }
        />
      )}
    </div>
  )
}
