import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight, BookOpen, CheckCircle, Square, CheckSquare, ChevronRight } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { journeysApi } from '../api/journeys'
import { useLanguage } from '../contexts/LanguageContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { Rating, AssessmentResponse } from '../types'

const RATING_ORDER: Rating[] = ['NEVER', 'RARELY', 'OFTEN', 'ALWAYS']

const ratingStyle: Record<Rating, { dot: string; badge: string }> = {
  NEVER:  { dot: 'bg-red-500',    badge: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800' },
  RARELY: { dot: 'bg-amber-500',  badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800' },
  OFTEN:  { dot: 'bg-blue-400',   badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' },
  ALWAYS: { dot: 'bg-sage-400',   badge: 'bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 border-sage-100 dark:border-sage-800' },
}

function RatingSection({
  rating, responses, selectedIds, onToggle, lang, t, isAlways,
}: {
  rating: Rating
  responses: AssessmentResponse[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  lang: string
  t: (k: string) => string
  isAlways: boolean
}) {
  const [open, setOpen] = useState(false)
  const { dot, badge } = ratingStyle[rating]
  const labelKey = `assessment.${rating.toLowerCase()}`

  return (
    <div className="rounded-2xl border border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">{t(labelKey)}</span>
          {isAlways && (
            <span className="text-xs text-stone-400 dark:text-stone-500">{t('results.alreadyStrength')}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>
            {responses.length}
          </span>
          <ChevronRight
            size={15}
            className={`text-stone-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-warm-100 dark:border-stone-800 animate-fade-in">
          {responses.map((resp) => {
            const sentence = resp.sentence
            if (!sentence) return null
            const isSelected = selectedIds.has(sentence.id)
            return (
              <div
                key={resp.id}
                onClick={() => onToggle(sentence.id)}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sage-300 dark:border-sage-700 ring-1 ring-sage-200 dark:ring-sage-800 bg-sage-50 dark:bg-sage-900/10'
                    : 'border-warm-200 dark:border-stone-700 hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected
                      ? <CheckSquare size={17} className="text-sage-600 dark:text-sage-400" />
                      : <Square size={17} className="text-stone-300 dark:text-stone-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-stone-800 dark:text-[#ede8e0] leading-relaxed">
                      {lang === 'mr' ? sentence.text_mr : sentence.text_en}
                    </p>
                    <p className="font-serif text-xs text-stone-400 dark:text-[#8b8576] italic mt-0.5">
                      {lang === 'mr' ? sentence.text_en : sentence.text_mr}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [visibleSuggestions, setVisibleSuggestions] = useState(5)

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['assessment-suggestions', assessmentId],
    queryFn: () => assessmentsApi.getSuggestions(assessmentId!),
    enabled: !!assessmentId,
  })

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId!),
    enabled: !!assessmentId,
  })

  const toggleSelect = (sentenceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sentenceId)) next.delete(sentenceId); else next.add(sentenceId)
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
        navigate(`/journeys/${firstJourneyId}`)
      } else {
        toast.success(t('results.started').replace('{count}', String(selectedIds.size)))
        navigate('/journeys')
      }
    }
  }

  if (suggestionsLoading || assessmentLoading) return <PageLoader />

  const hasSuggestions = suggestions && suggestions.length > 0
  const lacunaName = lang === 'mr' ? assessment?.lacuna?.name_mr : assessment?.lacuna?.name_en

  // Build set of suggested sentence IDs to exclude from rating sections
  const suggestedSentenceIds = new Set((suggestions ?? []).map((s) => s.sentence_id))

  // Group non-suggested responses by rating
  const grouped = RATING_ORDER.reduce<Record<Rating, AssessmentResponse[]>>(
    (acc, r) => { acc[r] = []; return acc },
    {} as Record<Rating, AssessmentResponse[]>
  )
  for (const resp of assessment?.responses ?? []) {
    if (!suggestedSentenceIds.has(resp.sentence_id) && resp.sentence) {
      grouped[resp.rating].push(resp)
    }
  }
  const hasAnyExtra = RATING_ORDER.some((r) => grouped[r].length > 0)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage-100 dark:bg-sage-900/40 mb-4">
          <Sparkles size={28} className="text-sage-600 dark:text-sage-400" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('results.title')}</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm max-w-sm mx-auto">
          {t('results.subtitle').replace('{lacuna}', lacunaName ?? '')}
        </p>
      </div>

      {hasSuggestions ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              {t('results.suggestedSentences').replace('{count}', String(suggestions.length)).replace('{plural}', suggestions.length !== 1 ? 's' : '')}
            </p>
            <button
              onClick={() => {
                if (selectedIds.size === suggestions.length) setSelectedIds(new Set())
                else setSelectedIds(new Set(suggestions.map((s) => s.sentence_id)))
              }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {selectedIds.size === suggestions.length ? t('results.deselectAll') : t('results.selectAll')}
            </button>
          </div>

          {suggestions.slice(0, visibleSuggestions).map((snap, idx) => {
            const isSelected = selectedIds.has(snap.sentence_id)
            return (
              <div
                key={snap.id}
                onClick={() => toggleSelect(snap.sentence_id)}
                className={`rounded-2xl border bg-white dark:bg-stone-900 p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sage-300 dark:border-sage-700 ring-1 ring-sage-200 shadow-card-hover'
                    : idx === 0
                    ? 'border-terra-200 dark:border-terra-800 ring-1 ring-terra-100 hover:shadow-card-hover'
                    : 'border-warm-200 dark:border-stone-700 hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? <CheckSquare size={18} className="text-sage-600" /> : <Square size={18} className="text-stone-300 dark:text-stone-600" />}
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${idx === 0 ? 'bg-terra-100 dark:bg-terra-900/40 text-terra-700 dark:text-terra-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                    {snap.priority_rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {idx === 0 && <Badge variant="warning">{t('results.topPriority')}</Badge>}
                      {snap.sentence?.sub_virtue && (
                        <Badge variant="muted">
                          {lang === 'mr' ? snap.sentence.sub_virtue.name_mr : snap.sentence.sub_virtue.name_en}
                        </Badge>
                      )}
                    </div>
                    <p className="font-serif text-base text-stone-800 dark:text-[#ede8e0] leading-relaxed mb-1">
                      {lang === 'mr' ? snap.sentence?.text_mr : snap.sentence?.text_en}
                    </p>
                    <p className="font-serif text-sm text-stone-400 dark:text-[#8b8576] italic mb-2">
                      {lang === 'mr' ? snap.sentence?.text_en : snap.sentence?.text_mr}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{snap.reason}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {visibleSuggestions < suggestions.length ? (
            <button
              onClick={() => setVisibleSuggestions((v) => v + 5)}
              className="w-full py-2.5 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-dashed border-warm-300 dark:border-stone-600 rounded-2xl hover:border-stone-300 dark:hover:border-stone-500 transition-colors"
            >
              {t('results.showMoreSuggestions').replace('{count}', String(Math.min(5, suggestions.length - visibleSuggestions)))}
            </button>
          ) : suggestions.length > 5 && (
            <button
              onClick={() => setVisibleSuggestions(5)}
              className="w-full py-2.5 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-dashed border-warm-300 dark:border-stone-600 rounded-2xl hover:border-stone-300 dark:hover:border-stone-500 transition-colors"
            >
              {t('results.showLess')}
            </button>
          )}
        </div>
      ) : suggestions !== undefined ? (
        <div className="rounded-2xl border border-sage-100 dark:border-sage-800 bg-sage-50 dark:bg-sage-900/20 p-8 text-center">
          <CheckCircle size={32} className="text-sage-400 mx-auto mb-3" />
          <p className="font-semibold text-stone-700 dark:text-stone-300">{t('results.excellentAwareness')}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('results.alreadyStrong')}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-warm-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-8 text-center">
          <BookOpen size={28} className="text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p className="text-stone-500 dark:text-stone-400 text-sm">{t('results.noSuggestions')}</p>
        </div>
      )}

      {/* Extra rated sentences grouped by rating */}
      {hasAnyExtra && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            {t('results.browseMore')}
          </p>
          {RATING_ORDER.map((rating) => {
            const responses = grouped[rating]
            if (responses.length === 0) return null
            return (
              <RatingSection
                key={rating}
                rating={rating}
                responses={responses}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                lang={lang}
                t={t}
                isAlways={rating === 'ALWAYS'}
              />
            )
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="sticky bottom-16 lg:bottom-4 z-20">
          <div className="rounded-2xl bg-stone-800 dark:bg-stone-700 text-white p-3 flex items-center justify-between gap-4 shadow-lg animate-slide-up">
            <p className="text-sm font-medium">
              {t('results.journeysSelected').replace('{count}', String(selectedIds.size)).replace('{plural}', selectedIds.size !== 1 ? 's' : '')}
            </p>
            <Button size="sm" className="bg-white text-stone-800 hover:bg-stone-100 border-0" loading={creating} onClick={startSelectedJourneys}>
              {selectedIds.size > 1 ? t('results.startAll') : t('results.startJourney')} <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2 pb-6">
        <Button variant="secondary" onClick={() => navigate('/lacunae')}>{t('results.backToLacunae')}</Button>
        <Button onClick={() => navigate('/journeys')}>{t('results.myJourneys')} <ArrowRight size={15} /></Button>
      </div>
    </div>
  )
}
