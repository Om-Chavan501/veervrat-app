import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight, BookOpen, CheckCircle, Square, CheckSquare } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { journeysApi } from '../api/journeys'
import { useLanguage } from '../contexts/LanguageContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'

export function AssessmentResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
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
        navigate(`/journeys/${firstJourneyId}/clarify/${assessmentId}`)
      } else {
        toast.success(t('results.started').replace('{count}', String(selectedIds.size)))
        navigate('/journeys')
      }
    }
  }

  if (isLoading) return <PageLoader />

  const hasSuggestions = suggestions && suggestions.length > 0
  const lacunaName = lang === 'mr' ? assessment?.lacuna?.name_mr : assessment?.lacuna?.name_en

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
              onClick={() => { if (selectedIds.size === suggestions.length) setSelectedIds(new Set()); else setSelectedIds(new Set(suggestions.map((s) => s.sentence_id))) }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {selectedIds.size === suggestions.length ? t('results.deselectAll') : t('results.selectAll')}
            </button>
          </div>

          {suggestions.map((snap, idx) => {
            const isSelected = selectedIds.has(snap.sentence_id)
            return (
              <div
                key={snap.id}
                onClick={() => toggleSelect(snap.sentence_id)}
                className={`rounded-2xl border bg-white dark:bg-stone-900 p-4 transition-all cursor-pointer ${
                  isSelected ? 'border-sage-300 dark:border-sage-700 ring-1 ring-sage-200 shadow-card-hover'
                    : idx === 0 ? 'border-terra-200 dark:border-terra-800 ring-1 ring-terra-100 hover:shadow-card-hover'
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
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-relaxed mb-1">
                      {lang === 'mr' ? snap.sentence?.text_mr : snap.sentence?.text_en}
                    </p>
                    <p className="text-xs text-stone-400 italic mb-2">
                      {lang === 'mr' ? snap.sentence?.text_en : snap.sentence?.text_mr}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{snap.reason}</p>
                  </div>
                </div>
              </div>
            )
          })}

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

      <div className="flex justify-center gap-3 pt-2 pb-6">
        <Button variant="secondary" onClick={() => navigate('/lacunae')}>{t('results.backToLacunae')}</Button>
        <Button onClick={() => navigate('/journeys')}>{t('results.myJourneys')} <ArrowRight size={15} /></Button>
      </div>
    </div>
  )
}
