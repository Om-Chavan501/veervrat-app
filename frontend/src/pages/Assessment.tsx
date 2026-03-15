import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Rating, Sentence } from '../types'

const RATINGS: { value: Rating; label: string; desc: string; color: string }[] = [
  { value: 'ALWAYS', label: 'Always', desc: 'This is consistently true for me', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
  { value: 'OFTEN', label: 'Often', desc: 'True more often than not', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { value: 'RARELY', label: 'Rarely', desc: 'Rarely true for me', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
  { value: 'NEVER', label: 'Never', desc: 'This is never true for me', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
]

function SentenceRow({
  sentence,
  currentRating,
  onRate,
  onUnrate,
}: {
  sentence: Sentence
  currentRating?: Rating
  onRate: (sentenceId: string, rating: Rating) => void
  onUnrate: (sentenceId: string) => void
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${currentRating ? 'border-sage-200 bg-sage-50' : 'border-warm-200 bg-white'}`}>
      <div className="flex items-start gap-3 mb-3">
        {currentRating ? (
          <CheckCircle2 size={16} className="text-sage-600 mt-0.5 flex-shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-stone-300 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-sm text-stone-800 leading-relaxed">{sentence.text_en}</p>
          <p className="text-xs text-stone-500 mt-0.5">{sentence.text_mr}</p>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="flex flex-wrap gap-2 ml-7">
        {RATINGS.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => {
              if (currentRating === value) {
                onUnrate(sentence.id)
              } else {
                onRate(sentence.id, value)
              }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              currentRating === value
                ? color + ' ring-2 ring-offset-1 ring-current font-semibold'
                : 'bg-white text-stone-500 border-stone-200 hover:bg-warm-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Assessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId!),
    enabled: !!assessmentId,
  })

  const rateMutation = useMutation({
    mutationFn: ({ sentenceId, rating }: { sentenceId: string; rating: Rating }) =>
      assessmentsApi.saveResponse(assessmentId!, sentenceId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const unrateMutation = useMutation({
    mutationFn: (sentenceId: string) =>
      assessmentsApi.deleteResponse(assessmentId!, sentenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const completeMutation = useMutation({
    mutationFn: () => assessmentsApi.complete(assessmentId!),
    onSuccess: () => {
      toast.success('Assessment completed!')
      navigate(`/assessment-results/${assessmentId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading || !assessment) return <PageLoader />

  if (assessment.status === 'COMPLETED') {
    navigate(`/assessment-results/${assessmentId}`)
    return null
  }

  // Build response map
  const responseMap = new Map(assessment.responses.map((r) => [r.sentence_id, r.rating]))

  // Group sentences by subvirtue
  const subVirtues = assessment.lacuna?.lacuna_sub_virtues ?? []
  const totalSentences = subVirtues.reduce(
    (acc, lsv) => acc + (lsv.sub_virtue?.sentences?.length ?? 0),
    0
  )
  const answeredCount = assessment.responses.length
  const progress = totalSentences > 0 ? (answeredCount / totalSentences) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="warning">In progress</Badge>
          <span className="text-xs text-stone-400">{answeredCount}/{totalSentences} answered</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">
          {assessment.lacuna?.name_en} Assessment
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Rate each sentence honestly to identify areas for growth
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-stone-500 mt-1">{Math.round(progress)}% complete</p>
      </div>

      {/* Info card */}
      <Card padding="sm" className="bg-blue-50 border-blue-100">
        <div className="flex gap-3">
          <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-medium">Rating guide</p>
            <p><strong>Always/Often</strong> — you already exhibit this behaviour (less urgent)</p>
            <p><strong>Rarely/Never</strong> — this is an area for cultivation (suggested for journeys)</p>
          </div>
        </div>
      </Card>

      {/* Sentences by subvirtue */}
      {subVirtues.map((lsv) => {
        const sv = lsv.sub_virtue
        if (!sv) return null
        return (
          <div key={lsv.id}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-stone-700">{sv.name_en}</h2>
              <span className="text-xs text-stone-400">/ {sv.name_mr}</span>
              {sv.virtue && (
                <Badge variant="muted" className="ml-auto">
                  {sv.virtue.name_en}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {sv.sentences?.map((sentence) => (
                <SentenceRow
                  key={sentence.id}
                  sentence={sentence}
                  currentRating={responseMap.get(sentence.id)}
                  onRate={(sid, rating) => rateMutation.mutate({ sentenceId: sid, rating })}
                  onUnrate={(sid) => unrateMutation.mutate(sid)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Complete button */}
      <div className="sticky bottom-4 lg:static">
        <Card padding="md" className="bg-sage-50 border-sage-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-800">Ready to complete?</p>
              <p className="text-xs text-stone-500">
                {answeredCount > 0
                  ? `You've rated ${answeredCount} sentences. Completing will generate suggestions.`
                  : 'Rate at least one sentence to continue.'}
              </p>
            </div>
            <Button
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
              disabled={answeredCount === 0}
            >
              Complete <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
