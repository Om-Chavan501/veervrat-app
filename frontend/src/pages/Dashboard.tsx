import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, BookOpen, ClipboardList, Users, ArrowRight, Plus, Bell } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { journeysApi } from '../api/journeys'
import { vratmitraApi } from '../api/vratmitra'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import type { DashboardStats, Journey, Vratmitra } from '../types'
import { formatDistanceToNow } from 'date-fns'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-stone-800">{value}</p>
        <p className="text-sm text-stone-500">{label}</p>
      </div>
    </Card>
  )
}

function JourneyCard({ journey }: { journey: Journey }) {
  const stateColors: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    COMPLETED: 'info',
  }

  return (
    <Link to={`/journeys/${journey.id}`}>
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-warm-50 transition-colors group cursor-pointer border border-transparent hover:border-warm-200">
        <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
          <Route size={18} className="text-sage-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 line-clamp-2 leading-snug">
            {journey.sentence?.text_en ?? 'Loading...'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={stateColors[journey.state] as 'success' | 'warning' | 'info'}>
              {journey.state}
            </Badge>
            <span className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <ArrowRight size={16} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}

function InvitationCard({ inv }: { inv: Vratmitra }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
      <Bell size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-700">
          <span className="font-medium">{'Someone'}</span>{' '}
          invited you as Vratmitra
        </p>
        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
          {inv.journey?.sentence?.text_en}
        </p>
      </div>
      <Link
        to="/vratmitra"
        className="text-xs font-medium text-amber-700 hover:underline flex-shrink-0"
      >
        View
      </Link>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/users/me/dashboard').then((r) => r.data),
  })

  const { data: activeJourneys, isLoading: journeysLoading } = useQuery({
    queryKey: ['journeys', 'ACTIVE'],
    queryFn: () => journeysApi.list('ACTIVE'),
  })

  const { data: pendingInvitations } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: vratmitraApi.getPendingInvitations,
  })

  if (statsLoading || journeysLoading) return <PageLoader />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">
          {greeting}, {user?.name?.split(' ')[0]} 🌱
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Every moment of awareness is a step forward on your path.
        </p>
      </div>

      {/* Pending invitations alert */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="space-y-2">
          {pendingInvitations.slice(0, 2).map((inv) => (
            <InvitationCard key={inv.id} inv={inv} />
          ))}
          {pendingInvitations.length > 2 && (
            <Link to="/vratmitra" className="text-sm text-amber-700 font-medium hover:underline pl-4">
              +{pendingInvitations.length - 2} more invitations
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active journeys" value={stats.active_journeys} icon={Route} color="bg-sage-500" />
          <StatCard label="Reflections" value={stats.total_reflections} icon={BookOpen} color="bg-terra-500" />
          <StatCard label="Completed" value={stats.completed_journeys} icon={ClipboardList} color="bg-stone-500" />
          <StatCard label="Invitations" value={stats.pending_invitations} icon={Users} color="bg-amber-500" />
        </div>
      )}

      {/* Active Journeys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-800">Active Journeys</h2>
          <Link to="/lacunae">
            <Button variant="outline" size="sm">
              <Plus size={14} />
              New journey
            </Button>
          </Link>
        </div>

        {activeJourneys && activeJourneys.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-warm-100">
              {activeJourneys.slice(0, 5).map((j) => (
                <JourneyCard key={j.id} journey={j} />
              ))}
            </div>
            {activeJourneys.length > 5 && (
              <div className="p-4 pt-0">
                <Link to="/journeys" className="text-sm text-sage-600 font-medium hover:underline">
                  View all {activeJourneys.length} journeys →
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-4">
                <Route size={28} className="text-sage-400" />
              </div>
              <h3 className="font-medium text-stone-700 mb-2">No active journeys yet</h3>
              <p className="text-sm text-stone-500 mb-5 max-w-xs mx-auto">
                Begin by identifying a lacuna to work on. Your first step awaits.
              </p>
              <Link to="/lacunae">
                <Button>
                  <Plus size={16} />
                  Start your first journey
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-stone-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/lacunae', icon: BookOpen, label: 'Browse Lacunae', desc: 'Find areas to work on' },
            { to: '/journeys', icon: Route, label: 'My Journeys', desc: 'Review your practice' },
            { to: '/ontology', icon: ClipboardList, label: 'Ontology', desc: 'Explore virtues & sentences' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to}>
              <Card padding="md" className="hover:border-sage-200 hover:shadow-md transition-all cursor-pointer h-full">
                <Icon size={20} className="text-sage-500 mb-3" />
                <p className="text-sm font-semibold text-stone-800">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
