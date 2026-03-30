import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Users, CheckCircle, XCircle, Clock, Route, Globe, UserCheck, UserMinus } from 'lucide-react'
import { vratmitraApi } from '../api/vratmitra'
import { UserSearchCombobox } from '../components/UserSearchCombobox'
import type { UserSearchItem } from '../api/users'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'
import { useLanguage } from '../contexts/LanguageContext'
import { formatDistanceToNow } from 'date-fns'

export function Vratmitra() {
  const qc = useQueryClient()
  const { t, lang } = useLanguage()
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null)

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: vratmitraApi.getPendingInvitations,
  })

  const { data: mentored, isLoading: mentoredLoading } = useQuery({
    queryKey: ['mentored-journeys'],
    queryFn: vratmitraApi.getMyMentoredJourneys,
  })

  const { data: globalVm, isLoading: globalLoading } = useQuery({
    queryKey: ['global-vratmitra'],
    queryFn: vratmitraApi.getGlobal,
  })

  const { data: globalPending } = useQuery({
    queryKey: ['global-vratmitra-pending'],
    queryFn: vratmitraApi.getGlobalPending,
  })

  const acceptMutation = useMutation({
    mutationFn: (journeyId: string) => vratmitraApi.accept(journeyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-invitations'] })
      qc.invalidateQueries({ queryKey: ['mentored-journeys'] })
      toast.success(t('vratmitra.acceptedToast'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const detachMutation = useMutation({
    mutationFn: (journeyId: string) => vratmitraApi.detach(journeyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentored-journeys'] })
      toast.success(t('vratmitra.detachedToast'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const inviteGlobalMutation = useMutation({
    mutationFn: (inviteeId: string) => vratmitraApi.inviteGlobal(inviteeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-vratmitra'] })
      setSelectedUser(null)
      toast.success(t('vratmitra.inviteGlobal'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const removeGlobalMutation = useMutation({
    mutationFn: () => vratmitraApi.removeGlobal(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-vratmitra'] })
      qc.invalidateQueries({ queryKey: ['global-vratmitra-pending'] })
      toast.success(t('vratmitra.removeGlobal'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const acceptGlobalMutation = useMutation({
    mutationFn: () => vratmitraApi.acceptGlobal(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-vratmitra-pending'] })
      toast.success(t('vratmitra.globalActive'))
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (pendingLoading || mentoredLoading || globalLoading) return <PageLoader />

  return (
    <div className="space-y-8 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">{t('vratmitra.title')}</h1>
        <p className="text-stone-500 mt-1 text-sm">{t('vratmitra.subtitle')}</p>
      </div>

      {/* Global Vratmitra */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-sage-600" />
          <h2 className="text-base font-semibold text-stone-800">{t('vratmitra.globalSection')}</h2>
        </div>

        {globalVm ? (
          <Card padding="md" className={globalVm.status === 'ACTIVE' ? 'border-sage-200 bg-sage-50/40' : 'border-amber-200 bg-amber-50'}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center">
                  <UserCheck size={16} className="text-sage-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{globalVm.vratmitra?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {globalVm.status === 'ACTIVE' ? (
                      <Badge variant="success">{t('vratmitra.globalActive')}</Badge>
                    ) : (
                      <Badge variant="warning">{t('vratmitra.globalPending')}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => removeGlobalMutation.mutate()}
                loading={removeGlobalMutation.isPending}
              >
                <UserMinus size={14} /> {t('vratmitra.removeGlobal')}
              </Button>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <div className="flex gap-2">
              <div className="flex-1">
                <UserSearchCombobox
                  onSelect={setSelectedUser}
                  placeholder={t('userSearch.placeholder')}
                />
              </div>
              <Button
                size="sm"
                disabled={!selectedUser}
                loading={inviteGlobalMutation.isPending}
                onClick={() => selectedUser && inviteGlobalMutation.mutate(selectedUser.id)}
              >
                {t('vratmitra.inviteGlobal')}
              </Button>
            </div>
            {selectedUser && (
              <p className="text-xs text-sage-600 mt-2">{selectedUser.name}</p>
            )}
          </Card>
        )}

        {/* Pending global invitations received */}
        {globalPending && globalPending.length > 0 && (
          <div className="mt-3 space-y-2">
            {globalPending.map((inv) => (
              <Card key={inv.id} padding="md" className="border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-stone-700">
                    <span className="font-semibold">{inv.user?.name}</span> {t('vratmitra.globalInviteReceived')}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => removeGlobalMutation.mutate()} loading={removeGlobalMutation.isPending}>
                      <XCircle size={14} /> {t('vratmitra.decline')}
                    </Button>
                    <Button size="sm" onClick={() => acceptGlobalMutation.mutate()} loading={acceptGlobalMutation.isPending}>
                      <CheckCircle size={14} /> {t('vratmitra.accept')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-stone-800">{t('vratmitra.pending')}</h2>
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
                      <Badge variant="warning">{t('vratmitra.pendingBadge')}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-stone-800 mb-0.5">
                      {t('vratmitra.invites')}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {t('vratmitra.journey')} {lang === 'mr' ? inv.journey?.sentence?.text_mr : inv.journey?.sentence?.text_en}
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
                      <XCircle size={14} /> {t('vratmitra.decline')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(inv.journey_id)}
                      loading={acceptMutation.isPending}
                    >
                      <CheckCircle size={14} /> {t('vratmitra.accept')}
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
              title={t('vratmitra.noPending')}
              description={t('vratmitra.noPendingDesc')}
            />
          </Card>
        )}
      </div>

      {/* Journeys I'm mentoring */}
      <div>
        <h2 className="text-base font-semibold text-stone-800 mb-4">{t('vratmitra.mentoring')}</h2>

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
                        <Badge variant="success">{t('vratmitra.activeMentor')}</Badge>
                      </div>
                      <p className="text-sm font-medium text-stone-800 line-clamp-2">
                        {lang === 'mr' ? vm.journey?.sentence?.text_mr : vm.journey?.sentence?.text_en}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {vm.accepted_at
                          ? formatDistanceToNow(new Date(vm.accepted_at), { addSuffix: true })
                          : t('vratmitra.recently')}
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
                      {t('vratmitra.detach')}
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
              title={t('vratmitra.notMentoring')}
              description={t('vratmitra.notMentoringDesc')}
            />
          </Card>
        )}
      </div>
    </div>
  )
}
