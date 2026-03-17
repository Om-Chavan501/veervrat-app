import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { assessmentsApi } from '../api/assessments'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'

export function Assessments() {
  const navigate = useNavigate()

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => assessmentsApi.list(),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Assessments</h1>
          <p className="text-stone-500 mt-1 text-sm">
            Your lacuna assessments and their results
          </p>
        </div>
        <Button onClick={() => navigate('/lacunae')}>
          Start new assessment
        </Button>
      </div>

      {!assessments || assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Go to Lacunae to start your first assessment"
          action={<Button onClick={() => navigate('/lacunae')}>Browse Lacunae</Button>}
        />
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Card
              key={a.id}
              padding="md"
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() =>
                navigate(
                  a.status === 'COMPLETED'
                    ? `/assessment-results/${a.id}`
                    : `/assessments/${a.id}`
                )
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {a.status === 'COMPLETED' ? 'Completed' : 'In progress'}
                    </Badge>
                    {a.lacuna && (
                      <Badge variant="muted">{a.lacuna.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-stone-800">
                    {a.lacuna?.name_en ?? 'Assessment'}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(a.started_at).toLocaleDateString()}
                    {a.completed_at && ` · Completed ${new Date(a.completed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-stone-400 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
