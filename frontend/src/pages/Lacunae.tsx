import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Plus, ChevronRight, Search, CheckCircle2 } from 'lucide-react'
import { lacunaeApi } from '../api/lacunae'
import { shortlistsApi } from '../api/shortlists'
import { assessmentsApi } from '../api/assessments'
import { useLanguage } from '../contexts/LanguageContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Lacuna, LacunaCategory } from '../types'

const categoryColors: Record<LacunaCategory, 'default' | 'warning' | 'info'> = {
  A: 'default', B: 'warning', C: 'info',
}

export function Lacunae() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<LacunaCategory | 'all'>('all')
  const [shortlistId, setShortlistId] = useState<string | null>(null)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categoryLabels: Record<LacunaCategory, string> = {
    A: t('lacunae.primary'), B: t('lacunae.secondary'), C: t('lacunae.supporting'),
  }

  const { data: lacunae, isLoading } = useQuery({ queryKey: ['lacunae'], queryFn: lacunaeApi.list })
  const { data: sessions } = useQuery({ queryKey: ['shortlist-sessions'], queryFn: shortlistsApi.list })

  const createSessionMutation = useMutation({
    mutationFn: () => shortlistsApi.create(),
    onSuccess: (session) => {
      setShortlistId(session.id)
      queryClient.invalidateQueries({ queryKey: ['shortlist-sessions'] })
      toast.success(t('lacunae.sessionStarted'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const batchUpdateMutation = useMutation({
    mutationFn: ({ sid, lacunaIds }: { sid: string; lacunaIds: string[] }) =>
      shortlistsApi.batchUpdate(sid, lacunaIds),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const startAssessmentMutation = useMutation({
    mutationFn: (lacuna_id: string) => assessmentsApi.start(lacuna_id, shortlistId ?? undefined),
    onSuccess: (assessment) => {
      queryClient.setQueryData(['assessment', assessment.id], assessment)
      navigate(`/assessments/${assessment.id}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const debouncedSync = useCallback((sid: string, ids: string[]) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      batchUpdateMutation.mutate({ sid, lacunaIds: ids })
    }, 600)
  }, [batchUpdateMutation])

  if (isLoading) return <PageLoader />

  const filtered = lacunae?.filter((l) => {
    const matchSearch = !search || l.name_en.toLowerCase().includes(search.toLowerCase()) || l.name_mr.includes(search)
    const matchCategory = selectedCategory === 'all' || l.category === selectedCategory
    return matchSearch && matchCategory
  })

  const grouped = (filtered ?? []).reduce<Record<LacunaCategory, Lacuna[]>>(
    (acc, l) => { if (!acc[l.category]) acc[l.category] = []; acc[l.category].push(l); return acc },
    { A: [], B: [], C: [] }
  )

  const toggleShortlist = (lacunaId: string) => {
    if (!shortlistId) { toast.error(t('lacunae.startSessionFirst')); return }
    const next = new Set(shortlisted)
    if (next.has(lacunaId)) next.delete(lacunaId); else next.add(lacunaId)
    setShortlisted(next)
    debouncedSync(shortlistId, Array.from(next))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('lacunae.title')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">{t('lacunae.subtitle')}</p>
        </div>
        {!shortlistId ? (
          <Button onClick={() => createSessionMutation.mutate()} loading={createSessionMutation.isPending}>
            <Plus size={16} />{t('lacunae.startShortlist')}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="success">{t('lacunae.selected').replace('{count}', String(shortlisted.size))}</Badge>
            <Button variant="primary" size="sm" disabled={shortlisted.size === 0} onClick={() => navigate(`/shortlists/${shortlistId}`)}>
              {t('lacunae.reviewSelection')}
            </Button>
          </div>
        )}
      </div>

      {sessions && sessions.length > 0 && !shortlistId && (
        <Card padding="sm">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide px-2 mb-2">
            {t('lacunae.recentShortlists')}
          </p>
          <div className="space-y-1">
            {sessions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => { setShortlistId(s.id); setShortlisted(new Set(s.items.map((i) => i.lacuna_id))); toast.success(t('lacunae.sessionResumed')) }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
              >
                <span>{new Date(s.created_at).toLocaleDateString()} · {t('lacunae.lacunaeCount').replace('{count}', String(s.items.length))}</span>
                <ChevronRight size={14} className="text-stone-400" />
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
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
        <div className="flex gap-2">
          {(['all', 'A', 'B', 'C'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-sage-500 text-white'
                  : 'bg-white dark:bg-stone-800 border border-warm-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-warm-50 dark:hover:bg-stone-700'
              }`}
            >
              {cat === 'all' ? t('lacunae.all') : t('lacunae.cat').replace('{cat}', cat)}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => {
        if (items.length === 0) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
              {categoryLabels[cat as LacunaCategory]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((lacuna) => {
                const isSelected = shortlisted.has(lacuna.id)
                return (
                  <div
                    key={lacuna.id}
                    className={`group relative flex items-start gap-3 p-4 rounded-xl border bg-white dark:bg-stone-900 transition-all ${
                      isSelected
                        ? 'border-sage-300 dark:border-sage-700 bg-sage-50 dark:bg-sage-900/20 shadow-sm'
                        : 'border-warm-200 dark:border-stone-700 hover:border-warm-300 dark:hover:border-stone-600 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={categoryColors[lacuna.category]}>{lacuna.category}</Badge>
                        {isSelected && <CheckCircle2 size={14} className="text-sage-600" />}
                      </div>
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                        {lang === 'mr' ? lacuna.name_mr : lacuna.name_en}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {lang === 'mr' ? lacuna.name_en : lacuna.name_mr}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {shortlistId && (
                        <button
                          onClick={() => toggleShortlist(lacuna.id)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-400 hover:bg-sage-200'
                              : 'bg-warm-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-warm-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {isSelected ? t('lacunae.remove') : t('lacunae.add')}
                        </button>
                      )}
                      <button
                        onClick={() => startAssessmentMutation.mutate(lacuna.id)}
                        disabled={startAssessmentMutation.isPending}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-terra-100 dark:bg-terra-900/30 text-terra-700 dark:text-terra-400 hover:bg-terra-200 transition-colors"
                      >
                        {t('lacunae.assess')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filtered?.length === 0 && (
        <EmptyState icon={BookOpen} title={t('lacunae.notFound')} description={t('lacunae.tryAdjusting')} />
      )}
    </div>
  )
}
