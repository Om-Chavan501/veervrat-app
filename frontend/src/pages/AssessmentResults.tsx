import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { journeysApi } from '../api/journeys'
import { Card } from '../components/ui/Card'
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
    mutationFn: (sentenceId: string) =>
      journeysApi.create(sentenceId, assessmentId!),
    onSuccess: (journey) => {
      navigate(`/journeys/${journey.id}/clarify/${assessmentId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 mb-4">
          <Sparkles size={28} className="text-sage-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Assessment Complete</h1>
        <p className="text-stone-500 mt-2 text-sm max-w-md mx-auto">
          Based on your responses, here are the sentences most worth cultivating for{' '}
          <strong>{assessment?.lacuna?.name_en}</strong>
        </p>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Suggested sentences ({suggestions.length})
          </p>
          {suggestions.map((snap, idx) => (
            <Card key={snap.id} padding="md" className={`border-l-4 ${idx === 0 ? 'border-l-terra-400' : 'border-l-warm-300'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center">
                      {snap.priority_rank}
                    </span>
                    {snap.sentence?.sub_virtue && (
                      <Badge variant="muted">{snap.sentence.sub_virtue.name_en}</Badge>
                    )}
                    {idx === 0 && <Badge variant="warning">Highest priority</Badge>}
                  </div>
                  <p className="text-sm font-medium text-stone-800 leading-relaxed mb-1">
                    {snap.sentence?.text_en}
                  </p>
                  <p className="text-xs text-stone-500 mb-2">{snap.sentence?.text_mr}</p>
                  <p className="text-xs text-stone-400 italic">{snap.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createJourneyMutation.mutate(snap.sentence_id)}
                  loading={createJourneyMutation.isPending}
                  className="flex-shrink-0"
                >
                  Start journey <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <BookOpen size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">No suggestions generated</p>
            <p className="text-sm text-stone-500 mt-1">
              All sentences were rated Always or Often — great work!
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/lacunae')}>
          Back to lacunae
        </Button>
        <Button onClick={() => navigate('/journeys')}>
          My journeys →
        </Button>
      </div>
    </div>
  )
}
