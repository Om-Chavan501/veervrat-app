import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Search, Plus, Minus } from 'lucide-react'
import { lacunaeApi } from '../api/lacunae'
import { shortlistsApi } from '../api/shortlists'
import { useLanguage } from '../contexts/LanguageContext'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { getErrorMessage } from '../api/client'
import type { Lacuna, LacunaCategory } from '../types'

const CATEGORIES: LacunaCategory[] = ['A', 'B', 'C']

export function Lacunae() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const hasInitialized = useRef(false)

  const { data: lacunae, isLoading: lacunaeLoading } = useQuery({
    queryKey: ['lacunae'],
    queryFn: lacunaeApi.list,
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['shortlist-sessions'],
    queryFn: shortlistsApi.list,
  })

  // Auto-resume most recent session on load
  useEffect(() => {
    if (!hasInitialized.current && sessions !== undefined) {
      hasInitialized.current = true
      if (sessions.length > 0) {
        const latest = sessions[0]
        setSessionId(latest.id)
        setShortlisted(new Set(latest.items.map((i) => i.lacuna_id)))
      }
    }
  }, [sessions])

  const handleToggle = async (lacunaId: string) => {
    const isSelected = shortlisted.has(lacunaId)
    const prev = new Set(shortlisted)
    const next = new Set(shortlisted)
    if (isSelected) {
      next.delete(lacunaId)
    } else {
      next.add(lacunaId)
    }
    setShortlisted(next)

    try {
      if (isSelected) {
        await shortlistsApi.removeItem(sessionId!, lacunaId)
      } else {
        let sid = sessionId
        if (!sid) {
          const session = await shortlistsApi.create()
          sid = session.id
          setSessionId(sid)
        }
        await shortlistsApi.addItem(sid, lacunaId)
      }
      queryClient.invalidateQueries({ queryKey: ['shortlist-sessions'] })
    } catch (e) {
      setShortlisted(prev)
      toast.error(getErrorMessage(e))
    }
  }

  if (lacunaeLoading || sessionsLoading) return <PageLoader />

  const grouped = (lacunae ?? []).reduce<Record<LacunaCategory, Lacuna[]>>(
    (acc, l) => {
      acc[l.category].push(l)
      return acc
    },
    { A: [], B: [], C: [] }
  )

  const filterFn = (l: Lacuna) =>
    !search ||
    l.name_en.toLowerCase().includes(search.toLowerCase()) ||
    l.name_mr.includes(search)

  const allFiltered = (lacunae ?? []).filter(filterFn)

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-6 -mt-6 lg:-mt-8 flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 lg:pt-8 pb-3 space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {t('lacunae.title')}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-sm">
            {t('lacunae.subtitle')}
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-warm-200 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
            placeholder={t('lacunae.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {allFiltered.length === 0 && search ? (
        <div className="px-4 sm:px-6 py-8">
          <EmptyState
            icon={BookOpen}
            title={t('lacunae.notFound')}
            description={t('lacunae.tryAdjusting')}
          />
        </div>
      ) : (
        /* 3-column layout — each column independently scrollable */
        <div className="px-4 sm:px-6 flex gap-1.5 sm:gap-3" style={{ height: 'calc(100dvh - 260px)' }}>
          {CATEGORIES.map((cat) => {
            const items = grouped[cat].filter(filterFn)
            return (
              <div key={cat} className="flex-1 flex flex-col min-w-0">
                {/* Column header */}
                <div className="py-2 text-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                    {t(`lacunae.col${cat}`)}
                  </span>
                </div>
                {/* Scrollable cards */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pb-2">
                  {items.map((lacuna) => {
                    const isSelected = shortlisted.has(lacuna.id)
                    return (
                      <button
                        key={lacuna.id}
                        onClick={() => handleToggle(lacuna.id)}
                        className={`w-full text-left p-2 sm:p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-sage-300 dark:border-sage-700 bg-sage-50 dark:bg-sage-900/20'
                            : 'border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-warm-300 dark:hover:border-stone-600 active:bg-warm-50 dark:active:bg-stone-800'
                        }`}
                      >
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-snug line-clamp-2">
                          {lang === 'mr' ? lacuna.name_mr : lacuna.name_en}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate leading-tight">
                          {lang === 'mr' ? lacuna.name_en : lacuna.name_mr}
                        </p>
                        <div
                          className={`mt-1.5 flex items-center gap-0.5 text-[10px] font-medium ${
                            isSelected
                              ? 'text-sage-600 dark:text-sage-400'
                              : 'text-stone-400 dark:text-stone-500'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Minus size={9} />
                              {t('lacunae.remove')}
                            </>
                          ) : (
                            <>
                              <Plus size={9} />
                              {t('lacunae.add')}
                            </>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-between mt-auto">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {shortlisted.size > 0
            ? t('lacunae.selected').replace('{count}', String(shortlisted.size))
            : t('lacunae.noneSelected')}
        </span>
        <Button
          size="sm"
          variant="primary"
          disabled={shortlisted.size === 0 || !sessionId}
          onClick={() => navigate(`/shortlists/${sessionId}`)}
        >
          {t('lacunae.reviewSelection')}
        </Button>
      </div>
    </div>
  )
}
