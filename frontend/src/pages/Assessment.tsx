import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { assessmentsApi } from '../api/assessments'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Rating, Sentence } from '../types'

const RATINGS: { value: Rating; label: string; short: string; color: string; activeColor: string }[] = [
  {
    value: 'ALWAYS',
    label: 'Always',
    short: 'A',
    color: 'border-red-200 text-red-600 hover:bg-red-50',
    activeColor: 'bg-red-100 border-red-400 text-red-700 ring-2 ring-red-200',
  },
  {
    value: 'OFTEN',
    label: 'Often',
    short: 'O',
    color: 'border-amber-200 text-amber-600 hover:bg-amber-50',
    activeColor: 'bg-amber-100 border-amber-400 text-amber-700 ring-2 ring-amber-200',
  },
  {
    value: 'RARELY',
    label: 'Rarely',
    short: 'R',
    color: 'border-blue-200 text-blue-600 hover:bg-blue-50',
    activeColor: 'bg-blue-100 border-blue-400 text-blue-700 ring-2 ring-blue-200',
  },
  {
    value: 'NEVER',
    label: 'Never',
    short: 'N',
    color: 'border-sage-200 text-sage-600 hover:bg-sage-50',
    activeColor: 'bg-sage-100 border-sage-400 text-sage-700 ring-2 ring-sage-200',
  },
]

function SentenceRow({
  sentence,
  index,
  currentRating,
  onRate,
  onUnrate,
}: {
  sentence: Sentence
  index: number
  currentRating?: Rating
  onRate: (sentenceId: string, rating: Rating) => void
  onUnrate: (sentenceId: string) => void
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        currentRating
          ? 'border-sage-200 bg-sage-50/60 shadow-sm'
          : 'border-warm-200 bg-white hover:border-warm-300 hover:shadow-sm'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-100 text-stone-400 text-xs font-medium flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-800 leading-relaxed">{sentence.text_en}</p>
            <p className="text-xs text-stone-400 mt-0.5 italic">{sentence.text_mr}</p>
          </div>
          {currentRating && (
            <CheckCircle2 size={16} className="text-sage-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Rating buttons */}
        <div className="flex gap-2 mt-3 ml-9">
          {RATINGS.map(({ value, label, color, activeColor }) => (
            <button
              key={value}
              onClick={() => {
                if (currentRating === value) onUnrate(sentence.id)
                else onRate(sentence.id, value)
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                currentRating === value ? activeColor : `bg-white ${color}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SubVirtueSection({
  name_en,
  name_mr,
  virtue_name,
  sentences,
  responseMap,
  onRate,
  onUnrate,
}: {
  name_en: string
  name_mr: string
  virtue_name?: string
  sentences: Sentence[]
  responseMap: Map<string, Rating>
  onRate: (sid: string, rating: Rating) => void
  onUnrate: (sid: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const rated = sentences.filter((s) => responseMap.has(s.id)).length
  const total = sentences.length
  const allDone = rated === total

  return (
    <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden shadow-card">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-warm-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              allDone ? 'bg-sage-500' : rated > 0 ? 'bg-amber-400' : 'bg-stone-300'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-stone-800">{name_en}</span>
              <span className="text-xs text-stone-400">/ {name_mr}</span>
              {virtue_name && (
                <span className="hidden sm:inline text-xs text-stone-400 bg-warm-100 px-2 py-0.5 rounded-full">
                  {virtue_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              allDone
                ? 'bg-sage-100 text-sage-700'
                : rated > 0
                ? 'bg-amber-50 text-amber-700'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {rated}/{total}
          </span>
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Progress bar strip */}
      <div className="h-0.5 bg-warm-100 mx-4">
        <div
          className="h-full bg-sage-400 transition-all duration-500 rounded-full"
          style={{ width: total > 0 ? `${(rated / total) * 100}%` : '0%' }}
        />
      </div>

      {/* Sentences */}
      {!collapsed && (
        <div className="p-4 pt-3 space-y-3 animate-fade-in">
          {sentences.map((sentence, idx) => (
            <SentenceRow
              key={sentence.id}
              sentence={sentence}
              index={idx}
              currentRating={responseMap.get(sentence.id)}
              onRate={onRate}
              onUnrate={onUnrate}
            />
          ))}
        </div>
      )}
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
      toast.success('Assessment complete!')
      navigate(`/assessment-results/${assessmentId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading || !assessment) return <PageLoader />

  if (assessment.status === 'COMPLETED') {
    navigate(`/assessment-results/${assessmentId}`)
    return null
  }

  const responseMap = new Map(assessment.responses.map((r) => [r.sentence_id, r.rating]))
  const subVirtues = assessment.lacuna?.lacuna_sub_virtues ?? []
  const totalSentences = subVirtues.reduce((acc, lsv) => acc + (lsv.sub_virtue?.sentences?.length ?? 0), 0)
  const answeredCount = assessment.responses.length
  const progress = totalSentences > 0 ? (answeredCount / totalSentences) * 100 : 0
  const canComplete = answeredCount > 0

  return (
    <div className="animate-fade-in">

      {/* ── Sticky progress header ── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 glass border-b border-warm-200/80 shadow-sticky">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge variant="warning">In progress</Badge>
            <h1 className="text-sm font-semibold text-stone-700 truncate">
              {assessment.lacuna?.name_en}
            </h1>
          </div>
          <span className="text-xs text-stone-500 flex-shrink-0">
            <span className="font-semibold text-stone-700">{answeredCount}</span>
            <span className="text-stone-400"> / {totalSentences}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1.5">
          {Math.round(progress)}% rated
          {progress === 100 && (
            <span className="text-sage-600 font-medium ml-1.5">· All sentences rated!</span>
          )}
        </p>
      </div>

      {/* ── Page title (non-sticky) ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {assessment.lacuna?.name_en} Assessment
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Rate each sentence honestly to identify areas for growth
        </p>
      </div>

      {/* ── Rating guide ── */}
      <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex gap-3">
        <AlertCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 space-y-0.5">
          <p className="font-semibold mb-1">Rating guide</p>
          <p><span className="font-medium text-red-600">Always / Often</span> — you already exhibit this (less urgent)</p>
          <p><span className="font-medium text-sage-600">Rarely / Never</span> — area for cultivation → suggested for journeys</p>
        </div>
      </div>

      {/* ── Sub-virtue sections ── */}
      <div className="space-y-4 mb-6">
        {subVirtues.map((lsv) => {
          const sv = lsv.sub_virtue
          if (!sv || !sv.sentences?.length) return null
          return (
            <SubVirtueSection
              key={lsv.id}
              name_en={sv.name_en}
              name_mr={sv.name_mr}
              virtue_name={sv.virtue?.name_en}
              sentences={sv.sentences}
              responseMap={responseMap}
              onRate={(sid, rating) => rateMutation.mutate({ sentenceId: sid, rating })}
              onUnrate={(sid) => unrateMutation.mutate(sid)}
            />
          )
        })}
      </div>

      {/* spacer so content doesn't hide behind fixed footer */}
      <div className="h-20 lg:h-16" />

      {/* ── Fixed docked complete footer ── */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 z-30 glass border-t border-warm-200/80 shadow-sticky">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div
            className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 transition-all duration-300 ${
              canComplete ? 'bg-sage-500 border-sage-600' : 'bg-white border-warm-200'
            }`}
          >
            <div>
              <p className={`text-sm font-semibold ${canComplete ? 'text-white' : 'text-stone-600'}`}>
                {canComplete
                  ? progress === 100
                    ? 'All sentences rated — ready to complete!'
                    : `${answeredCount} sentence${answeredCount !== 1 ? 's' : ''} rated`
                  : 'Rate at least one sentence to continue'}
              </p>
              {canComplete && progress < 100 && (
                <p className="text-xs mt-0.5 text-sage-100">
                  {totalSentences - answeredCount} remaining — you can complete now or keep going
                </p>
              )}
            </div>
            <Button
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
              disabled={!canComplete}
              className={canComplete ? 'bg-white text-sage-700 hover:bg-sage-50 border-0 shadow-sm flex-shrink-0' : 'flex-shrink-0'}
            >
              Complete <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
