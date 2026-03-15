import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Users, CheckCircle, XCircle, Clock, Route } from 'lucide-react'
import { vratmitraApi } from '../api/vratmitra'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import { formatDistanceToNow } from 'date-fns'

export function Vratmitra() {
  const qc = useQueryClient()

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: vratmitraApi.getPendingInvitations,
  })

  const { data: mentored, isLoading: mentoredLoading } = useQuery({
    queryKey: ['mentored-journeys'],
    queryFn: vratmitraApi.getMyMentoredJourneys,
  })

  const acceptMutation = useMutation({
    mutationFn: (journeyId: string) => vratmitraApi.accept(journeyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-invitations'] })
      qc.invalidateQueries({ queryKey: ['mentored-journeys'] })
      toast.success('Invitation accepted! You are now a Vratmitra.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const detachMutation = useMutation({
    mutationFn: (journeyId: string) => vratmitraApi.detach(journeyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentored-journeys'] })
      toast.success('Detached from journey')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (pendingLoading || mentoredLoading) return <PageLoader />

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Vratmitra</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Manage your mentorship invitations and journeys you are supporting
        </p>
      </div>

      {/* Pending invitations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-stone-800">Pending Invitations</h2>
          {pending && pending.length > 0 && (
            <Badge variant="warning">{pending.length}</Badge>
          )}
        </div>

        {pending && pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((inv) => (
              <Card key={inv.id} padding="md" className="border-amber-200 bg-amber-50">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-amber-600" />
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 mb-0.5">
                      Someone invites you as Vratmitra
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      Journey: {inv.journey?.sentence?.text_en}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => detachMutation.mutate(inv.journey_id)}
                      loading={detachMutation.isPending}
                    >
                      <XCircle size={14} /> Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(inv.journey_id)}
                      loading={acceptMutation.isPending}
                    >
                      <CheckCircle size={14} /> Accept
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Clock}
              title="No pending invitations"
              description="When someone invites you as their Vratmitra, it will appear here"
            />
          </Card>
        )}
      </div>

      {/* Journeys I'm mentoring */}
      <div>
        <h2 className="text-base font-semibold text-stone-800 mb-4">Journeys I'm Mentoring</h2>

        {mentored && mentored.length > 0 ? (
          <div className="space-y-3">
            {mentored.map((vm) => (
              <Link key={vm.id} to={`/journeys/${vm.journey_id}`}>
                <Card
                  padding="md"
                  className="hover:border-sage-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Route size={18} className="text-sage-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="success">Active mentor</Badge>
                      </div>
                      <p className="text-sm font-medium text-stone-800 line-clamp-2">
                        {vm.journey?.sentence?.text_en}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        Accepted {vm.accepted_at
                          ? formatDistanceToNow(new Date(vm.accepted_at), { addSuffix: true })
                          : 'recently'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.preventDefault()
                        detachMutation.mutate(vm.journey_id)
                      }}
                      loading={detachMutation.isPending}
                      className="flex-shrink-0"
                    >
                      Detach
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Users}
              title="Not mentoring anyone"
              description="Accept an invitation to start mentoring someone on their journey"
            />
          </Card>
        )}
      </div>
    </div>
  )
}
