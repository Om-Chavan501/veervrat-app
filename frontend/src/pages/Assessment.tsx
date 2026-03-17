import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, ArrowRight, AlertCircle, ChevronDown, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { assessmentsApi } from '../api/assessments'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Rating, Sentence } from '../types'

function SentenceRow({ sentence, index, currentRating, onRate, onUnrate, lang, t }: {
  sentence: Sentence; index: number; currentRating?: Rating
  onRate: (id: string, r: Rating) => void; onUnrate: (id: string) => void
  lang: string; t: (k: string) => string
}) {
  const ratings: { value: Rating; key: string; color: string; activeColor: string }[] = [
    { value: 'ALWAYS', key: 'assessment.always', color: 'border-red-200 text-red-600 hover:bg-red-50', activeColor: 'bg-red-100 border-red-400 text-red-700 ring-2 ring-red-200' },
    { value: 'OFTEN', key: 'assessment.often', color: 'border-amber-200 text-amber-600 hover:bg-amber-50', activeColor: 'bg-amber-100 border-amber-400 text-amber-700 ring-2 ring-amber-200' },
    { value: 'RARELY', key: 'assessment.rarely', color: 'border-blue-200 text-blue-600 hover:bg-blue-50', activeColor: 'bg-blue-100 border-blue-400 text-blue-700 ring-2 ring-blue-200' },
    { value: 'NEVER', key: 'assessment.never', color: 'border-sage-200 text-sage-600 hover:bg-sage-50', activeColor: 'bg-sage-100 border-sage-400 text-sage-700 ring-2 ring-sage-200' },
  ]

  return (
    <div className={`rounded-xl border transition-all duration-200 ${currentRating ? 'border-sage-200 dark:border-sage-700 bg-sage-50/60 dark:bg-sage-900/10 shadow-sm' : 'border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-warm-300 hover:shadow-sm'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-100 dark:bg-stone-800 text-stone-400 text-xs font-medium flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-800 dark:text-stone-100 leading-relaxed">
              {lang === 'mr' ? sentence.text_mr : sentence.text_en}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 italic">
              {lang === 'mr' ? sentence.text_en : sentence.text_mr}
            </p>
          </div>
          {currentRating && <CheckCircle2 size={16} className="text-sage-500 flex-shrink-0 mt-0.5" />}
        </div>
        <div className="flex gap-2 mt-3 ml-9">
          {ratings.map(({ value, key, color, activeColor }) => (
            <button
              key={value}
              onClick={() => { if (currentRating === value) onUnrate(sentence.id); else onRate(sentence.id, value) }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${currentRating === value ? activeColor : `bg-white dark:bg-stone-800 ${color}`}`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SubVirtueSection({ name_en, name_mr, virtue_name, sentences, responseMap, onRate, onUnrate, lang, t }: {
  name_en: string; name_mr: string; virtue_name?: string; sentences: Sentence[]
  responseMap: Map<string, Rating>; onRate: (sid: string, r: Rating) => void; onUnrate: (sid: string) => void
  lang: string; t: (k: string) => string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const rated = sentences.filter((s) => responseMap.has(s.id)).length
  const total = sentences.length
  const allDone = rated === total

  return (
    <div className="rounded-2xl border border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden shadow-card">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${allDone ? 'bg-sage-500' : rated > 0 ? 'bg-amber-400' : 'bg-stone-300'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                {lang === 'mr' ? name_mr : name_en}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">/ {lang === 'mr' ? name_en : name_mr}</span>
              {virtue_name && (
                <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500 bg-warm-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                  {virtue_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${allDone ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-400' : rated > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
            {rated}/{total}
          </span>
          <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
        </div>
      </button>
      <div className="h-0.5 bg-warm-100 dark:bg-stone-800 mx-4">
        <div className="h-full bg-sage-400 transition-all duration-500 rounded-full" style={{ width: total > 0 ? `${(rated / total) * 100}%` : '0%' }} />
      </div>
      {!collapsed && (
        <div className="p-4 pt-3 space-y-3 animate-fade-in">
          {sentences.map((sentence, idx) => (
            <SentenceRow key={sentence.id} sentence={sentence} index={idx} currentRating={responseMap.get(sentence.id)} onRate={onRate} onUnrate={onUnrate} lang={lang} t={t} />
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
  const { t, lang } = useLanguage()
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId!),
    enabled: !!assessmentId,
  })

  const rateMutation = useMutation({
    mutationFn: ({ sentenceId, rating }: { sentenceId: string; rating: Rating }) =>
      assessmentsApi.saveResponse(assessmentId!, sentenceId, rating),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const unrateMutation = useMutation({
    mutationFn: (sentenceId: string) => assessmentsApi.deleteResponse(assessmentId!, sentenceId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const completeMutation = useMutation({
    mutationFn: () => assessmentsApi.complete(assessmentId!),
    onSuccess: () => {
      setShowCompleteConfirm(false)
      toast.success(t('assessment.completedToast'))
      navigate(`/assessment-results/${assessmentId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading || !assessment) return <PageLoader />
  if (assessment.status === 'COMPLETED') { navigate(`/assessment-results/${assessmentId}`); return null }

  const responseMap = new Map(assessment.responses.map((r) => [r.sentence_id, r.rating]))
  const subVirtues = assessment.lacuna?.lacuna_sub_virtues ?? []
  const totalSentences = subVirtues.reduce((acc, lsv) => acc + (lsv.sub_virtue?.sentences?.length ?? 0), 0)
  const answeredCount = assessment.responses.length
  const progress = totalSentences > 0 ? (answeredCount / totalSentences) * 100 : 0
  const canComplete = answeredCount > 0

  const lacunaName = lang === 'mr' ? assessment.lacuna?.name_mr : assessment.lacuna?.name_en

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 glass border-b border-warm-200/80 dark:border-stone-700/80 shadow-sticky">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge variant="warning">{t('assessment.inProgress')}</Badge>
            <h1 className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{lacunaName}</h1>
          </div>
          <span className="text-xs text-stone-500 flex-shrink-0">
            <span className="font-semibold text-stone-700 dark:text-stone-200">{answeredCount}</span>
            <span className="text-stone-400 dark:text-stone-500"> / {totalSentences}</span>
          </span>
        </div>
        <div className="h-1.5 bg-warm-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div className="h-full bg-sage-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
          {t('assessment.ratedPercent').replace('{pct}', String(Math.round(progress)))}
          {progress === 100 && <span className="text-sage-600 font-medium ml-1.5">· {t('assessment.allRated')}</span>}
        </p>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{lacunaName}</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">{t('assessment.subtitle')}</p>
      </div>

      <div className="mb-6 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-3">
        <AlertCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
          <p className="font-semibold mb-1">{t('assessment.ratingGuide')}</p>
          <p><span className="font-medium text-red-600">{t('assessment.always')} / {t('assessment.often')}</span> — {t('assessment.ratingAlwaysOften').split('— ')[1]}</p>
          <p><span className="font-medium text-sage-600">{t('assessment.rarely')} / {t('assessment.never')}</span> — {t('assessment.ratingRarelyNever').split('— ')[1]}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {subVirtues.map((lsv) => {
          const sv = lsv.sub_virtue
          if (!sv || !sv.sentences?.length) return null
          return (
            <SubVirtueSection
              key={lsv.id}
              name_en={sv.name_en} name_mr={sv.name_mr}
              virtue_name={lang === 'mr' ? sv.virtue?.name_mr : sv.virtue?.name_en}
              sentences={sv.sentences} responseMap={responseMap}
              onRate={(sid, rating) => rateMutation.mutate({ sentenceId: sid, rating })}
              onUnrate={(sid) => unrateMutation.mutate(sid)}
              lang={lang} t={t}
            />
          )
        })}
      </div>

      <div className="h-20 lg:h-16" />

      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-60 right-0 z-30 glass border-t border-warm-200/80 dark:border-stone-700/80 shadow-sticky">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 transition-all duration-300 ${canComplete ? 'bg-sage-500 border-sage-600' : 'bg-white dark:bg-stone-900 border-warm-200 dark:border-stone-700'}`}>
            <div>
              <p className={`text-sm font-semibold ${canComplete ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`}>
                {canComplete
                  ? progress === 100 ? t('assessment.allReadyToComplete')
                    : t('assessment.sentencesRated').replace('{count}', String(answeredCount)).replace('{plural}', answeredCount !== 1 ? 's' : '')
                  : t('assessment.rateAtLeastOne')}
              </p>
              {canComplete && progress < 100 && (
                <p className="text-xs mt-0.5 text-sage-100">
                  {t('assessment.remaining').replace('{count}', String(totalSentences - answeredCount))}
                </p>
              )}
            </div>
            <Button
              onClick={() => setShowCompleteConfirm(true)}
              disabled={!canComplete}
              className={canComplete ? 'bg-white text-sage-700 hover:bg-sage-50 border-0 shadow-sm flex-shrink-0' : 'flex-shrink-0'}
            >
              {t('assessment.complete')} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <Modal open={showCompleteConfirm} onClose={() => setShowCompleteConfirm(false)} title={t('assessment.confirmTitle')} size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-0.5">
                {progress < 100 ? t('assessment.unratedCount').replace('{count}', String(totalSentences - answeredCount)) : t('assessment.allRatedConfirm')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{t('assessment.confirmWarning')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCompleteConfirm(false)}>
              {t('assessment.keepGoing')}
            </Button>
            <Button variant="primary" className="flex-1" loading={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
              {t('assessment.complete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
