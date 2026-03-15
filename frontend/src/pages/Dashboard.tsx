import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, BookOpen, ClipboardList, Users, ArrowRight, Plus, Bell, TrendingUp, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { journeysApi } from '../api/journeys'
import { vratmitraApi } from '../api/vratmitra'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import type { DashboardStats, Journey, Vratmitra } from '../types'
import { formatDistanceToNow } from 'date-fns'

function StatCard({
  label,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  to,
}: {
  label: string
  value: number
  icon: React.ElementType
  bgColor: string
  iconColor: string
  to: string
}) {
  return (
    <Link to={to}>
      <div className={`relative rounded-2xl p-5 border border-white/60 overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${bgColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/40 group-hover:bg-white/60 transition-colors`}>
            <Icon size={18} className={iconColor} />
          </div>
          <ArrowRight size={14} className={`${iconColor} opacity-0 group-hover:opacity-60 transition-opacity mt-1`} />
        </div>
        <p className="text-2xl font-bold text-stone-800 mb-0.5">{value}</p>
        <p className="text-xs font-medium text-stone-600">{label}</p>
      </div>
    </Link>
  )
}

function JourneyCard({ journey }: { journey: Journey }) {
  return (
    <Link to={`/journeys/${journey.id}`}>
      <div className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-warm-50 transition-colors group cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Route size={15} className="text-sage-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 line-clamp-1 leading-snug">
            {journey.sentence?.text_en ?? '—'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {journey.sentence?.sub_virtue && (
              <span className="text-xs text-stone-400">{journey.sentence.sub_virtue.name_en}</span>
            )}
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-1.5" />
      </div>
    </Link>
  )
}

function InvitationBanner({ invitations }: { invitations: Vratmitra[] }) {
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800">
            {invitations.length === 1
              ? 'You have a Vratmitra invitation'
              : `You have ${invitations.length} Vratmitra invitations`}
          </p>
          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
            {invitations[0].journey?.sentence?.text_en}
          </p>
        </div>
        <Link to="/vratmitra">
          <Button size="sm" variant="secondary">
            View
          </Button>
        </Link>
      </div>
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
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {greeting}, {firstName}
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            Every moment of awareness is a step forward on your path.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-sage-600" />
        </div>
      </div>

      {/* ── Pending invitations ── */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <InvitationBanner invitations={pendingInvitations} />
      )}

      {/* ── Stats grid ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Active journeys"
            value={stats.active_journeys}
            icon={Route}
            bgColor="bg-sage-100"
            iconColor="text-sage-600"
            to="/journeys"
          />
          <StatCard
            label="Reflections"
            value={stats.total_reflections}
            icon={BookOpen}
            bgColor="bg-terra-100"
            iconColor="text-terra-600"
            to="/journeys"
          />
          <StatCard
            label="Completed"
            value={stats.completed_journeys}
            icon={TrendingUp}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
            to="/archive"
          />
          <StatCard
            label="Invitations"
            value={stats.pending_invitations}
            icon={Users}
            bgColor="bg-amber-100"
            iconColor="text-amber-600"
            to="/vratmitra"
          />
        </div>
      )}

      {/* ── Active journeys ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-stone-800">Active Journeys</h2>
          <Link to="/lacunae">
            <Button variant="ghost" size="sm">
              <Plus size={14} />
              New
            </Button>
          </Link>
        </div>

        {activeJourneys && activeJourneys.length > 0 ? (
          <div className="rounded-2xl bg-white border border-warm-200 shadow-card overflow-hidden">
            <div className="divide-y divide-warm-100">
              {activeJourneys.slice(0, 5).map((j) => (
                <JourneyCard key={j.id} journey={j} />
              ))}
            </div>
            {activeJourneys.length > 5 && (
              <div className="px-4 py-3 bg-warm-50 border-t border-warm-100">
                <Link
                  to="/journeys"
                  className="text-sm text-sage-600 font-medium hover:text-sage-700 flex items-center gap-1"
                >
                  View all {activeJourneys.length} journeys
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
              <Route size={24} className="text-sage-400" />
            </div>
            <h3 className="font-semibold text-stone-700 mb-1.5">No active journeys</h3>
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
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-base font-semibold text-stone-800 mb-3">Explore</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/lacunae', icon: BookOpen, label: 'Lacunae', desc: 'Find areas to work on', color: 'text-terra-500' },
            { to: '/journeys', icon: Route, label: 'Journeys', desc: 'Review practice', color: 'text-sage-600' },
            { to: '/ontology', icon: ClipboardList, label: 'Ontology', desc: 'Explore virtues', color: 'text-stone-500' },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}>
              <div className="rounded-2xl bg-white border border-warm-200 p-4 hover:border-sage-200 hover:shadow-card-hover transition-all cursor-pointer group">
                <div className={`w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center mb-3 group-hover:bg-sage-50 transition-colors`}>
                  <Icon size={17} className={color} />
                </div>
                <p className="text-sm font-semibold text-stone-800">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
