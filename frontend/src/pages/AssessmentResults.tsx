import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight, BookOpen, CheckCircle } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { journeysApi } from '../api/journeys'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'

export function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()

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

  const createJourneyMutation = useMutation({
    mutationFn: (sentenceId: string) => journeysApi.create(sentenceId, assessmentId!),
    onSuccess: (journey) => {
      navigate(`/journeys/${journey.id}/clarify/${assessmentId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />

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

      {suggestions && suggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            {suggestions.length} suggested sentence{suggestions.length !== 1 ? 's' : ''}
          </p>

          {suggestions.map((snap, idx) => (
            <div
              key={snap.id}
              className={`rounded-2xl border bg-white p-4 transition-all hover:shadow-card-hover ${
                idx === 0 ? 'border-terra-200 ring-1 ring-terra-100' : 'border-warm-200'
              }`}
            >
              <div className="flex items-start gap-3">
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
                    {idx === 0 && (
                      <Badge variant="warning">Top priority</Badge>
                    )}
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

              <div className="mt-3 pt-3 border-t border-warm-100 flex justify-end">
                <Button
                  size="sm"
                  variant={idx === 0 ? 'primary' : 'outline'}
                  onClick={() => createJourneyMutation.mutate(snap.sentence_id)}
                  loading={createJourneyMutation.isPending}
                >
                  Start journey <ArrowRight size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sage-100 bg-sage-50 p-8 text-center">
          <CheckCircle size={32} className="text-sage-400 mx-auto mb-3" />
          <p className="font-semibold text-stone-700">Excellent self-awareness!</p>
          <p className="text-sm text-stone-500 mt-1">
            All sentences rated Always or Often — you're already strong in this area.
          </p>
        </div>
      )}

      {/* ── Empty state for no suggestions ── */}
      {!suggestions && (
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
