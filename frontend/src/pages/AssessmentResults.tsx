import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight, BookOpen, CheckCircle, Square, CheckSquare } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { journeysApi } from '../api/journeys'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'

export function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['assessment-suggestions', assessmentId],
    queryFn: () => assessmentsApi.getSuggestions(assessmentId!),
    enabled: !!assessmentId,
  })

  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId!),
    enabled: !!assessmentId,
  })

  const toggleSelect = (sentenceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sentenceId)) next.delete(sentenceId)
      else next.add(sentenceId)
      return next
    })
  }

  const startSelectedJourneys = async () => {
    if (selectedIds.size === 0) return
    setCreating(true)
    let firstJourneyId: string | null = null
    for (const sentenceId of selectedIds) {
      try {
        const journey = await journeysApi.create(sentenceId, assessmentId!)
        if (!firstJourneyId) firstJourneyId = journey.id
      } catch (e) {
        toast.error(getErrorMessage(e))
      }
    }
    setCreating(false)
    if (firstJourneyId) {
      if (selectedIds.size === 1) {
        navigate(`/journeys/${firstJourneyId}/clarify/${assessmentId}`)
      } else {
        toast.success(`${selectedIds.size} journeys started`)
        navigate('/journeys')
      }
    }
  }

  if (isLoading) return <PageLoader />

  const hasSuggestions = suggestions && suggestions.length > 0

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">

      {/* ── Celebration header ── */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage-100 mb-4">
          <Sparkles size={28} className="text-sage-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Assessment Complete</h1>
        <p className="text-stone-500 mt-2 text-sm max-w-sm mx-auto">
          Here are the sentences most worth cultivating for{' '}
          <span className="font-semibold text-stone-700">{assessment?.lacuna?.name_en}</span>
        </p>
      </div>

      {hasSuggestions ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              {suggestions.length} suggested sentence{suggestions.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => {
                if (selectedIds.size === suggestions.length) {
                  setSelectedIds(new Set())
                } else {
                  setSelectedIds(new Set(suggestions.map((s) => s.sentence_id)))
                }
              }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {selectedIds.size === suggestions.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {suggestions.map((snap, idx) => {
            const isSelected = selectedIds.has(snap.sentence_id)
            return (
              <div
                key={snap.id}
                onClick={() => toggleSelect(snap.sentence_id)}
                className={`rounded-2xl border bg-white p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sage-300 ring-1 ring-sage-200 shadow-card-hover'
                    : idx === 0
                    ? 'border-terra-200 ring-1 ring-terra-100 hover:shadow-card-hover'
                    : 'border-warm-200 hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Select indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckSquare size={18} className="text-sage-600" />
                    ) : (
                      <Square size={18} className="text-stone-300" />
                    )}
                  </div>

                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
                      idx === 0 ? 'bg-terra-100 text-terra-700' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {snap.priority_rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {idx === 0 && <Badge variant="warning">Top priority</Badge>}
                      {snap.sentence?.sub_virtue && (
                        <Badge variant="muted">{snap.sentence.sub_virtue.name_en}</Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-stone-800 leading-relaxed mb-1">
                      {snap.sentence?.text_en}
                    </p>
                    <p className="text-xs text-stone-400 italic mb-2">{snap.sentence?.text_mr}</p>
                    <p className="text-xs text-stone-400">{snap.reason}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Multi-select action bar */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-16 lg:bottom-4 z-20">
              <div className="rounded-2xl bg-stone-800 text-white p-3 flex items-center justify-between gap-4 shadow-lg animate-slide-up">
                <p className="text-sm font-medium">
                  {selectedIds.size} journey{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
                <Button
                  size="sm"
                  className="bg-white text-stone-800 hover:bg-stone-100 border-0"
                  loading={creating}
                  onClick={startSelectedJourneys}
                >
                  Start {selectedIds.size > 1 ? 'all' : 'journey'} <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : suggestions !== undefined ? (
        <div className="rounded-2xl border border-sage-100 bg-sage-50 p-8 text-center">
          <CheckCircle size={32} className="text-sage-400 mx-auto mb-3" />
          <p className="font-semibold text-stone-700">Excellent self-awareness!</p>
          <p className="text-sm text-stone-500 mt-1">
            All sentences rated Always or Often — you're already strong in this area.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center">
          <BookOpen size={28} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">No suggestions available</p>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2 pb-6">
        <Button variant="secondary" onClick={() => navigate('/lacunae')}>
          Back to lacunae
        </Button>
        <Button onClick={() => navigate('/journeys')}>
          My journeys <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  )
}
