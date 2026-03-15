import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BookOpen, Plus, ChevronRight, Search, CheckCircle2 } from 'lucide-react'
import { lacunaeApi } from '../api/lacunae'
import { shortlistsApi } from '../api/shortlists'
import { assessmentsApi } from '../api/assessments'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Lacuna, LacunaCategory } from '../types'

const categoryColors: Record<LacunaCategory, string> = {
  A: 'danger',
  B: 'warning',
  C: 'info',
}

const categoryLabels: Record<LacunaCategory, string> = {
  A: 'Category A — Primary',
  B: 'Category B — Secondary',
  C: 'Category C — Supporting',
}

export function Lacunae() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<LacunaCategory | 'all'>('all')
  const [shortlistId, setShortlistId] = useState<string | null>(null)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())

  const { data: lacunae, isLoading } = useQuery({
    queryKey: ['lacunae'],
    queryFn: lacunaeApi.list,
  })

  const { data: sessions } = useQuery({
    queryKey: ['shortlist-sessions'],
    queryFn: shortlistsApi.list,
  })

  const createSessionMutation = useMutation({
    mutationFn: () => shortlistsApi.create(),
    onSuccess: (session) => {
      setShortlistId(session.id)
      queryClient.invalidateQueries({ queryKey: ['shortlist-sessions'] })
      toast.success('Shortlist session started')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addItemMutation = useMutation({
    mutationFn: ({ sid, lid }: { sid: string; lid: string }) =>
      shortlistsApi.addItem(sid, lid),
    onSuccess: (_, vars) => {
      setShortlisted((prev) => new Set([...prev, vars.lid]))
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: ({ sid, lid }: { sid: string; lid: string }) =>
      shortlistsApi.removeItem(sid, lid),
    onSuccess: (_, vars) => {
      setShortlisted((prev) => {
        const next = new Set(prev)
        next.delete(vars.lid)
        return next
      })
    },
  })

  const startAssessmentMutation = useMutation({
    mutationFn: (lacuna_id: string) => assessmentsApi.start(lacuna_id, shortlistId ?? undefined),
    onSuccess: (assessment) => {
      navigate(`/assessments/${assessment.id}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />

  const filtered = lacunae?.filter((l) => {
    const matchSearch =
      !search ||
      l.name_en.toLowerCase().includes(search.toLowerCase()) ||
      l.name_mr.includes(search)
    const matchCategory = selectedCategory === 'all' || l.category === selectedCategory
    return matchSearch && matchCategory
  })

  const grouped = (filtered ?? []).reduce<Record<LacunaCategory, Lacuna[]>>(
    (acc, l) => {
      if (!acc[l.category]) acc[l.category] = []
      acc[l.category].push(l)
      return acc
    },
    { A: [], B: [], C: [] }
  )

  const toggleShortlist = (lacunaId: string) => {
    if (!shortlistId) {
      toast.error('Start a shortlist session first')
      return
    }
    if (shortlisted.has(lacunaId)) {
      removeItemMutation.mutate({ sid: shortlistId, lid: lacunaId })
    } else {
      addItemMutation.mutate({ sid: shortlistId, lid: lacunaId })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Lacunae</h1>
          <p className="text-stone-500 mt-1 text-sm">
            Identify the inner weaknesses you wish to address
          </p>
        </div>
        {!shortlistId ? (
          <Button onClick={() => createSessionMutation.mutate()} loading={createSessionMutation.isPending}>
            <Plus size={16} />
            Start shortlist
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="success">{shortlisted.size} selected</Badge>
            <Button
              variant="primary"
              size="sm"
              disabled={shortlisted.size === 0}
              onClick={() => navigate(`/shortlists/${shortlistId}`)}
            >
              Review selection →
            </Button>
          </div>
        )}
      </div>

      {/* Previous sessions */}
      {sessions && sessions.length > 0 && !shortlistId && (
        <Card padding="sm">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide px-2 mb-2">
            Recent shortlists
          </p>
          <div className="space-y-1">
            {sessions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setShortlistId(s.id)
                  setShortlisted(new Set(s.items.map((i) => i.lacuna_id)))
                  toast.success('Resumed shortlist session')
                }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-warm-50 transition-colors"
              >
                <span>{new Date(s.created_at).toLocaleDateString()} · {s.items.length} lacunae</span>
                <ChevronRight size={14} className="text-stone-400" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-warm-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
              placeholder="Search lacunae..."
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
                  : 'bg-white border border-warm-200 text-stone-600 hover:bg-warm-50'
              }`}
            >
              {cat === 'all' ? 'All' : `Cat ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Lacunae by category */}
      {Object.entries(grouped).map(([cat, items]) => {
        if (items.length === 0) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">
              {categoryLabels[cat as LacunaCategory]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((lacuna) => {
                const isSelected = shortlisted.has(lacuna.id)
                return (
                  <div
                    key={lacuna.id}
                    className={`group relative flex items-start gap-3 p-4 rounded-xl border bg-white transition-all ${
                      isSelected
                        ? 'border-sage-300 bg-sage-50 shadow-sm'
                        : 'border-warm-200 hover:border-warm-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={categoryColors[lacuna.category] as 'danger' | 'warning' | 'info'}>
                          {lacuna.category}
                        </Badge>
                        {isSelected && (
                          <CheckCircle2 size={14} className="text-sage-600" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-stone-800">{lacuna.name_en}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{lacuna.name_mr}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {shortlistId && (
                        <button
                          onClick={() => toggleShortlist(lacuna.id)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                              : 'bg-warm-100 text-stone-600 hover:bg-warm-200'
                          }`}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </button>
                      )}
                      <button
                        onClick={() => startAssessmentMutation.mutate(lacuna.id)}
                        disabled={startAssessmentMutation.isPending}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-terra-100 text-terra-700 hover:bg-terra-200 transition-colors"
                      >
                        Assess
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
        <EmptyState
          icon={BookOpen}
          title="No lacunae found"
          description="Try adjusting your search or filter"
        />
      )}
    </div>
  )
}
