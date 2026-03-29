import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, CheckCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { assessmentsApi } from '../../api/assessments'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { ClarificationLink } from '../../types'

interface Props {
  journeyId: string
  originatingAssessmentId?: string
  links: ClarificationLink[]
}

export function ClarificationSetupCard({ journeyId, originatingAssessmentId, links }: Props) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [addingAnother, setAddingAnother] = useState(false)

  // Fetch originating assessment to get lacuna_id for filtering — only when adding another
  const { data: originatingAssessment } = useQuery({
    queryKey: ['assessment', originatingAssessmentId],
    queryFn: () => assessmentsApi.get(originatingAssessmentId!),
    enabled: !!originatingAssessmentId && addingAnother,
  })

  // Fetch all completed assessments — only when picker is open
  const { data: allAssessments } = useQuery({
    queryKey: ['assessments-list'],
    queryFn: () => assessmentsApi.list(),
    enabled: addingAnother,
  })

  const lacunaId = originatingAssessment?.lacuna_id

  const assessmentOptions = allAssessments?.filter((a) => {
    if (a.status !== 'COMPLETED') return false
    // Exclude already-linked assessments
    const linkedIds = new Set(links.map((l) => l.assessment_id))
    if (linkedIds.has(a.id)) return false
    // Filter by lacuna if we have it
    if (lacunaId) return a.lacuna_id === lacunaId
    return true
  }) ?? []

  function handleClarify() {
    if (originatingAssessmentId) {
      navigate(`/journeys/${journeyId}/clarify/${originatingAssessmentId}`)
    } else {
      navigate(`/journeys/${journeyId}/clarify`)
    }
  }

  function handlePickAssessment(assessmentId: string) {
    setAddingAnother(false)
    navigate(`/journeys/${journeyId}/clarify/${assessmentId}`)
  }

  // ── State A: no clarifications yet ──────────────────────────────────────────
  if (links.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-5">
        <div className="flex items-start gap-3">
          <FileText size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-stone-800">Understand the Why</p>
              <span className="text-xs text-stone-400 font-normal">optional</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Articulate how this sentence connects to your lacuna — while the assessment context is fresh.
            </p>
            <Button size="sm" variant="secondary" onClick={handleClarify}>
              Clarify →
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── State B/C: one or more clarification links ───────────────────────────────
  const first = links[0]
  const preview = first.lacuna_reduction_note.length > 100
    ? first.lacuna_reduction_note.slice(0, 100) + '…'
    : first.lacuna_reduction_note

  return (
    <div className="rounded-2xl border border-sage-200 bg-sage-50/40 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle size={16} className="text-sage-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-stone-800">Why understood</p>
            {links.length > 1 && (
              <Badge variant="muted">{links.length} clarifications</Badge>
            )}
          </div>

          {/* Preview of first link */}
          <p className="text-xs text-stone-600 leading-relaxed mb-1 italic">"{preview}"</p>
          {first.assessment?.lacuna && (
            <p className="text-xs text-stone-400 mb-3">
              For: {first.assessment.lacuna.name_en}
            </p>
          )}

          {/* Expanded list for multiple links */}
          {links.length > 1 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Hide' : `Show all ${links.length}`}
              </button>
              {expanded && (
                <div className="mt-2 space-y-2">
                  {links.slice(1).map((link) => (
                    <div key={link.id} className="rounded-lg bg-white border border-sage-100 px-3 py-2">
                      <p className="text-xs text-stone-600 italic leading-relaxed">
                        "{link.lacuna_reduction_note.length > 80
                          ? link.lacuna_reduction_note.slice(0, 80) + '…'
                          : link.lacuna_reduction_note}"
                      </p>
                      {link.assessment?.lacuna && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {link.assessment.lacuna.name_en}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add another */}
          {!addingAnother ? (
            <button
              type="button"
              onClick={() => setAddingAnother(true)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              <Plus size={12} /> Add another clarification
            </button>
          ) : (
            <div className="space-y-2 mt-1">
              <p className="text-xs font-medium text-stone-600">
                Pick an assessment to clarify against:
              </p>
              {assessmentOptions.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  {allAssessments ? 'No other completed assessments available.' : 'Loading…'}
                </p>
              ) : (
                <div className="space-y-1">
                  {assessmentOptions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handlePickAssessment(a.id)}
                      className="w-full text-left rounded-lg border border-warm-200 bg-white px-3 py-2 text-xs hover:border-sage-300 hover:bg-sage-50 transition-colors"
                    >
                      <span className="font-medium text-stone-700">{a.lacuna?.name_en}</span>
                      {a.completed_at && (
                        <span className="text-stone-400 ml-2">
                          {new Date(a.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAddingAnother(false)}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
