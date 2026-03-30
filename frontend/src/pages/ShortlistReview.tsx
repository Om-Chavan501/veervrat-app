import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Zap } from 'lucide-react'
import { shortlistsApi } from '../api/shortlists'
import { assessmentsApi } from '../api/assessments'
import { useLanguage } from '../contexts/LanguageContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import type { LacunaCategory } from '../types'

const categoryColors: Record<LacunaCategory, 'danger' | 'warning' | 'info'> = {
  A: 'danger', B: 'warning', C: 'info',
}

export function ShortlistReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, lang } = useLanguage()

  const { data: session, isLoading } = useQuery({
    queryKey: ['shortlist', id],
    queryFn: () => shortlistsApi.get(id!),
    enabled: !!id,
  })

  const startAssessmentMutation = useMutation({
    mutationFn: (lacuna_id: string) => assessmentsApi.start(lacuna_id, id),
    onSuccess: (assessment) => {
      queryClient.setQueryData(['assessment', assessment.id], assessment)
      navigate(`/assessments/${assessment.id}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (!session) return null

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/lacunae')}
          className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('shortlist.title')}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
            {t('shortlist.subtitle').replace('{count}', String(session.items.length))} · {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {session.items.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={t('shortlist.empty')}
          description={t('shortlist.emptyDesc')}
          action={<Button onClick={() => navigate('/lacunae')}>{t('shortlist.browse')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.items
            .sort((a, b) => a.rank - b.rank)
            .map((item) => {
              const lacuna = item.lacuna
              if (!lacuna) return null
              return (
                <Card key={item.id} padding="md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant={categoryColors[lacuna.category]}>Cat {lacuna.category}</Badge>
                        <span className="text-xs text-stone-400 dark:text-stone-500">#{item.rank}</span>
                      </div>
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                        {lang === 'mr' ? lacuna.name_mr : lacuna.name_en}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {lang === 'mr' ? lacuna.name_en : lacuna.name_mr}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      loading={startAssessmentMutation.isPending}
                      onClick={() => startAssessmentMutation.mutate(lacuna.id)}
                    >
                      {t('shortlist.assess')}
                    </Button>
                  </div>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
