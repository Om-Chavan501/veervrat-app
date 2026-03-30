import { useState } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Route, BookOpen, ClipboardList, Users, ArrowRight, Plus, Bell, TrendingUp, Sparkles, Share2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'
import { api } from '../api/client'
import { journeysApi } from '../api/journeys'
import { vratmitraApi } from '../api/vratmitra'
import { invitesApi } from '../api/invites'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { InviteSheet } from '../components/invite/InviteSheet'
import type { DashboardStats, Journey, Vratmitra } from '../types'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ label, value, icon: Icon, bgColor, iconColor, to }: {
  label: string; value: number; icon: React.ElementType; bgColor: string; iconColor: string; to: string
}) {
  const displayed = useCountUp(value, 600)
  return (
    <Link to={to}>
      <div className={`relative rounded-2xl p-5 border border-white/60 dark:border-white/5 overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${bgColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/40 dark:bg-black/20 group-hover:bg-white/60 dark:group-hover:bg-black/30 transition-colors">
            <Icon size={18} className={iconColor} />
          </div>
          <ArrowRight size={14} className={`${iconColor} opacity-0 group-hover:opacity-60 transition-opacity mt-1`} />
        </div>
        <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-0.5">{displayed}</p>
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</p>
      </div>
    </Link>
  )
}

function JourneyCard({ journey, lang }: { journey: Journey; lang: string }) {
  return (
    <Link to={`/journeys/${journey.id}`}>
      <div className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-warm-50 dark:hover:bg-stone-800 transition-colors group cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Route size={15} className="text-sage-600 dark:text-sage-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm text-stone-800 dark:text-[#ede8e0] line-clamp-2 leading-snug">
            {lang === 'mr' ? journey.sentence?.text_mr : journey.sentence?.text_en}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {journey.sentence?.sub_virtue && (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {lang === 'mr' ? journey.sentence.sub_virtue.name_mr : journey.sentence.sub_virtue.name_en}
              </span>
            )}
            <span className="text-xs text-stone-300 dark:text-stone-600">·</span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-1.5" />
      </div>
    </Link>
  )
}

function InvitationBanner({ invitations, t, lang }: { invitations: Vratmitra[]; t: (k: string) => string; lang: string }) {
  const msg = invitations.length === 1
    ? t('dashboard.invitationSingle')
    : t('dashboard.invitationMultiple').replace('{count}', String(invitations.length))
  return (
    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{msg}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
            {lang === 'mr'
              ? invitations[0].journey?.sentence?.text_mr
              : invitations[0].journey?.sentence?.text_en}
          </p>
        </div>
        <Link to="/vratmitra">
          <Button size="sm" variant="secondary">{t('dashboard.view')}</Button>
        </Link>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { t, lang } = useLanguage()
  const [inviteOpen, setInviteOpen] = useState(false)

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

  const { data: joined } = useQuery({
    queryKey: ['invite-joined'],
    queryFn: invitesApi.getJoined,
  })

  if (statsLoading || journeysLoading) return <PageLoader />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('dashboard.morning') : hour < 17 ? t('dashboard.afternoon') : t('dashboard.evening')
  const firstName = user?.name?.split(' ')[0] ?? ''

  const quickLinks = [
    { to: '/lacunae', icon: BookOpen, label: t('nav.lacunae'), desc: t('dashboard.lacunaeDesc'), color: 'text-terra-500' },
    { to: '/journeys', icon: Route, label: t('nav.journeys'), desc: t('dashboard.journeysDesc'), color: 'text-sage-600' },
    { to: '/ontology', icon: ClipboardList, label: t('nav.ontology'), desc: t('dashboard.ontologyDesc'), color: 'text-stone-500' },
  ]

  return (
    <div className="space-y-7 animate-enter">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {greeting}, {firstName}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-sage-600 dark:text-sage-400" />
        </div>
      </div>

      {pendingInvitations && pendingInvitations.length > 0 && (
        <InvitationBanner invitations={pendingInvitations} t={t} lang={lang} />
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t('dashboard.activeJourneys')} value={stats.active_journeys} icon={Route} bgColor="bg-sage-100 dark:bg-sage-900/40" iconColor="text-sage-600 dark:text-sage-400" to="/journeys" />
          <StatCard label={t('dashboard.reflections')} value={stats.total_reflections} icon={BookOpen} bgColor="bg-terra-100 dark:bg-[#3a2218]" iconColor="text-terra-600 dark:text-terra-400" to="/journeys" />
          <StatCard label={t('dashboard.completed')} value={stats.completed_journeys} icon={TrendingUp} bgColor="bg-blue-100 dark:bg-blue-950/60" iconColor="text-blue-600 dark:text-blue-400" to="/archive" />
          <StatCard label={t('dashboard.invitations')} value={stats.pending_invitations} icon={Users} bgColor="bg-amber-100 dark:bg-amber-950/50" iconColor="text-amber-600 dark:text-amber-400" to="/vratmitra" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.activeJourneysTitle')}</h2>
          <Link to="/lacunae">
            <Button variant="ghost" size="sm"><Plus size={14} />{t('dashboard.new')}</Button>
          </Link>
        </div>

        {activeJourneys && activeJourneys.length > 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#231c17] border border-warm-200 dark:border-[#3d3028] shadow-card overflow-hidden">
            <div className="divide-y divide-warm-100 dark:divide-[#3d3028]">
              {activeJourneys.slice(0, 5).map((j, i) => {
                const staggerDelay = ['delay-[0ms]','delay-[75ms]','delay-[150ms]','delay-[225ms]','delay-[300ms]']
                return (
                  <div key={j.id} className={`animate-enter ${staggerDelay[i]}`}>
                    <JourneyCard journey={j} lang={lang} />
                  </div>
                )
              })}
            </div>
            {activeJourneys.length > 5 && (
              <div className="px-4 py-3 bg-warm-50 dark:bg-[#2c2218] border-t border-warm-100 dark:border-[#3d3028]">
                <Link to="/journeys" className="text-sm text-sage-600 dark:text-sage-400 font-medium hover:text-sage-700 flex items-center gap-1">
                  {t('dashboard.viewAll').replace('{count}', String(activeJourneys.length))}
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-warm-300 dark:border-stone-700 bg-warm-50 dark:bg-stone-900 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center mx-auto mb-4">
              <Route size={24} className="text-sage-400" />
            </div>
            <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-1.5">{t('dashboard.noActiveJourneys')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 max-w-xs mx-auto">{t('dashboard.noJourneysSubtext')}</p>
            <Link to="/lacunae">
              <Button><Plus size={16} />{t('dashboard.startFirstJourney')}</Button>
            </Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100 mb-3">{t('dashboard.explore')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}>
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-700 p-4 hover:border-sage-200 hover:shadow-card-hover transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-xl bg-warm-100 dark:bg-stone-800 flex items-center justify-center mb-3 group-hover:bg-sage-50 dark:group-hover:bg-sage-900/30 transition-colors">
                  <Icon size={17} className={color} />
                </div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{label}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Invite activity */}
      <div>
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100 mb-3">{t('invite.dashboardTitle')}</h2>
        {joined && joined.length > 0 ? (
          <button
            onClick={() => setInviteOpen(true)}
            className="w-full text-left rounded-2xl bg-white dark:bg-stone-900 border border-warm-200 dark:border-stone-700 shadow-card overflow-hidden hover:border-sage-200 hover:shadow-card-hover transition-all"
          >
            <div className="px-4 py-3 border-b border-warm-100 dark:border-stone-800 flex items-center gap-2">
              <Share2 size={14} className="text-sage-600 dark:text-sage-400 flex-shrink-0" />
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('invite.joinedCount').replace('{count}', String(joined.length))}
              </p>
            </div>
            <div className="divide-y divide-warm-100 dark:divide-stone-800">
              {joined.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-sage-700 dark:text-sage-400">
                      {item.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <p className="flex-1 text-sm text-stone-700 dark:text-stone-300">
                    {t('invite.joinedItem').replace('{name}', item.name)}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(item.joined_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ) : (
          <button
            onClick={() => setInviteOpen(true)}
            className="w-full rounded-2xl border border-dashed border-warm-300 dark:border-stone-700 bg-warm-50 dark:bg-stone-900 p-5 flex items-center gap-3 hover:border-sage-300 dark:hover:border-sage-700 hover:bg-sage-50 dark:hover:bg-sage-900/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-warm-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 group-hover:bg-sage-100 dark:group-hover:bg-sage-900/30 transition-colors">
              <Share2 size={17} className="text-stone-400 dark:text-stone-500 group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{t('invite.inviteCta')}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t('invite.noJoins')}</p>
            </div>
          </button>
        )}
      </div>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
