import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Archive as ArchiveIcon, Route, ArrowRight, Play } from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import { formatDistanceToNow } from 'date-fns'

export function Archive() {
  const qc = useQueryClient()

  const { data: inactive, isLoading: inactiveLoading } = useQuery({
    queryKey: ['journeys', 'INACTIVE'],
    queryFn: () => journeysApi.list('INACTIVE'),
  })

  const { data: completed, isLoading: completedLoading } = useQuery({
    queryKey: ['journeys', 'COMPLETED'],
    queryFn: () => journeysApi.list('COMPLETED'),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => journeysApi.resume(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] })
      toast.success('Journey resumed!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (inactiveLoading || completedLoading) return <PageLoader />

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Archive</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Your paused and completed journeys — preserved for reflection
        </p>
      </div>

      {/* Paused journeys */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-stone-800">Paused Journeys</h2>
          {inactive && inactive.length > 0 && (
            <Badge variant="warning">{inactive.length}</Badge>
          )}
        </div>

        {inactive && inactive.length > 0 ? (
          <div className="space-y-3">
            {inactive.map((j) => (
              <Card key={j.id} padding="md">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Route size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 line-clamp-2">
                      {j.sentence?.text_en}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Paused {j.inactive_at
                        ? formatDistanceToNow(new Date(j.inactive_at), { addSuffix: true })
                        : 'some time ago'}
                    </p>
                    {j.inactive_reason && (
                      <p className="text-xs text-stone-500 mt-1 italic">"{j.inactive_reason}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeMutation.mutate(j.id)}
                      loading={resumeMutation.isPending}
                    >
                      <Play size={14} /> Resume
                    </Button>
                    <Link to={`/journeys/${j.id}`}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={ArchiveIcon}
              title="No paused journeys"
              description="Journeys you pause will appear here"
            />
          </Card>
        )}
      </div>

      {/* Completed journeys */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-stone-800">Completed Journeys</h2>
          {completed && completed.length > 0 && (
            <Badge variant="info">{completed.length}</Badge>
          )}
        </div>

        {completed && completed.length > 0 ? (
          <div className="space-y-3">
            {completed.map((j) => (
              <Link key={j.id} to={`/journeys/${j.id}`}>
                <Card
                  padding="md"
                  className="hover:border-sage-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Route size={18} className="text-sage-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="info" className="mb-1.5">Completed</Badge>
                      <p className="text-sm font-semibold text-stone-800 line-clamp-2">
                        {j.sentence?.text_en}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        Started {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-2"
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={ArchiveIcon}
              title="No completed journeys yet"
              description="Complete a journey to see it here — a permanent record of your growth"
            />
          </Card>
        )}
      </div>
    </div>
  )
}
