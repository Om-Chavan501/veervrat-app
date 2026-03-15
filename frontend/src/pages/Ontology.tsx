import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookMarked, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { api } from '../api/client'
import { Card } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import type { Virtue, SubVirtue, Sentence } from '../types'

export function Ontology() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data: virtues, isLoading } = useQuery({
    queryKey: ['ontology-virtues'],
    queryFn: () => api.get<Virtue[]>('/ontology/virtues').then((r) => r.data),
  })

  // We load sub-virtues lazily per virtue but for simplicity, show hierarchy from lacunae
  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Ontology</h1>
        <p className="text-stone-500 mt-1 text-sm">
          The curated knowledge base of virtues, sub-virtues, and behavioral sentences
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-warm-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-400"
          placeholder="Search virtues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Info note */}
      <Card padding="sm" className="bg-blue-50 border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>Read-only:</strong> The ontology is a curated knowledge base. Users practice sentences
          from this structure through their journeys.
        </p>
      </Card>

      {/* Virtues */}
      {virtues && virtues.length > 0 ? (
        <div className="space-y-3">
          {virtues
            .filter((v) => !search || v.name_en.toLowerCase().includes(search.toLowerCase()))
            .map((virtue) => (
              <Card key={virtue.id} padding="none">
                <button
                  onClick={() => toggleExpanded(virtue.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-warm-50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center">
                      <BookMarked size={16} className="text-sage-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-stone-800">{virtue.name_en}</p>
                      <p className="text-xs text-stone-500">{virtue.name_mr}</p>
                    </div>
                  </div>
                  {expanded.has(virtue.id) ? (
                    <ChevronDown size={16} className="text-stone-400" />
                  ) : (
                    <ChevronRight size={16} className="text-stone-400" />
                  )}
                </button>

                {expanded.has(virtue.id) && (
                  <VirtueDetails virtueId={virtue.id} />
                )}
              </Card>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No ontology data"
          description="Run the seed script to populate the ontology"
        />
      )}
    </div>
  )
}

function VirtueDetails({ virtueId }: { virtueId: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data: subVirtues, isLoading } = useQuery({
    queryKey: ['sub-virtues', virtueId],
    queryFn: () =>
      api.get<SubVirtue[]>(`/ontology/virtues/${virtueId}/sub-virtues`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="px-5 pb-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-warm-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-warm-100 px-5 pb-4 pt-3 space-y-2">
      {subVirtues?.map((sv) => (
        <div key={sv.id} className="rounded-lg border border-warm-100">
          <button
            onClick={() =>
              setExpanded((prev) => {
                const next = new Set(prev)
                if (next.has(sv.id)) next.delete(sv.id)
                else next.add(sv.id)
                return next
              })
            }
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-warm-50 rounded-lg transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-stone-700">{sv.name_en}</p>
              <p className="text-xs text-stone-400">{sv.name_mr}</p>
            </div>
            {expanded.has(sv.id) ? (
              <ChevronDown size={14} className="text-stone-400" />
            ) : (
              <ChevronRight size={14} className="text-stone-400" />
            )}
          </button>
          {expanded.has(sv.id) && <SubVirtueDetails subVirtueId={sv.id} />}
        </div>
      ))}
    </div>
  )
}

function SubVirtueDetails({ subVirtueId }: { subVirtueId: string }) {
  const { data: sentences, isLoading } = useQuery({
    queryKey: ['sentences', subVirtueId],
    queryFn: () =>
      api
        .get<Sentence[]>(`/ontology/sentences`, { params: { sub_virtue_id: subVirtueId } })
        .then((r) => r.data),
  })

  if (isLoading) return <div className="px-4 pb-3 text-xs text-stone-400">Loading...</div>

  return (
    <div className="px-4 pb-3 space-y-2 border-t border-warm-50">
      {sentences?.map((s, idx) => (
        <div key={s.id} className="flex gap-3 py-2">
          <span className="text-xs text-stone-400 w-5 flex-shrink-0 mt-0.5">{idx + 1}.</span>
          <div>
            <p className="text-xs text-stone-700 leading-relaxed">{s.text_en}</p>
            <p className="text-xs text-stone-400 italic">{s.text_mr}</p>
          </div>
        </div>
      ))}
      {sentences?.length === 0 && (
        <p className="text-xs text-stone-400 py-2">No sentences for this sub-virtue</p>
      )}
    </div>
  )
}
