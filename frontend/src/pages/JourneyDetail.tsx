import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BookOpen, Plus, Pause, Play, CheckCircle,
  Eye, Users, ArrowLeft, Calendar, Lightbulb, Shield, UserCheck
} from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { reflectionsApi } from '../api/reflections'
import { activitiesApi } from '../api/activities'
import { vratmitraApi } from '../api/vratmitra'
import { UserSearchCombobox } from '../components/UserSearchCombobox'
import type { UserSearchItem } from '../api/users'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { getErrorMessage } from '../api/client'
import { JourneyPhaseBar, type JourneyPhase } from '../components/journey/JourneyPhaseBar'
import { CatalogPicker } from '../components/journey/CatalogPicker'
import { ExposureList, ResolutionList } from '../components/journey/ActivityList'
import { ChallengeCard } from '../components/journey/ChallengeCard'
import { ClarificationSetupCard } from '../components/journey/ClarificationSetupCard'
import { formatDistanceToNow, format } from 'date-fns'
import type { Reflection, ExposureStatus, ResolutionStatus } from '../types'

const PRACTICE_TABS = ['Exposures', 'Resolutions', 'Reflections'] as const
type PracticeTab = (typeof PRACTICE_TABS)[number]

const PRACTICE_TAB_ICONS: Record<PracticeTab, React.ElementType> = {
  Exposures: Eye,
  Resolutions: Lightbulb,
  Reflections: BookOpen,
}

function ReflectionForm({
  journeyId, existing, onSuccess,
}: { journeyId: string; existing?: Reflection; onSuccess: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    applied: existing?.applied ?? true,
    context_note: existing?.context_note ?? '',
    insight_note: existing?.insight_note ?? '',
    difficulty: existing?.difficulty?.toString() ?? '',
  })
  const mutation = useMutation({
    mutationFn: () =>
      existing
        ? reflectionsApi.update(journeyId, existing.id, {
            applied: form.applied,
            context_note: form.context_note,
            insight_note: form.insight_note,
            difficulty: form.difficulty ? parseInt(form.difficulty) : undefined,
          })
        : reflectionsApi.create(journeyId, {
            applied: form.applied,
            context_note: form.context_note,
            insight_note: form.insight_note,
            difficulty: form.difficulty ? parseInt(form.difficulty) : undefined,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reflections', journeyId] })
      toast.success(existing ? 'Reflection updated' : 'Reflection saved')
      onSuccess()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Did you apply this sentence today?</label>
        <div className="flex gap-3">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setForm({ ...form, applied: v })}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                form.applied === v
                  ? v ? 'bg-sage-100 text-sage-700 border-sage-300' : 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-stone-600 border-warm-200 hover:bg-warm-50'
              }`}
            >
              {v ? '✓ Yes, I did' : '✗ Not today'}
            </button>
          ))}
        </div>
      </div>
      <Textarea label="What happened? (context)" value={form.context_note} onChange={(e) => setForm({ ...form, context_note: e.target.value })} placeholder="Describe the situation..." rows={3} required />
      <Textarea label="What did you learn? (insight)" value={form.insight_note} onChange={(e) => setForm({ ...form, insight_note: e.target.value })} placeholder="What insight or awareness arose..." rows={3} required />
      <Input label="Difficulty 1–10 (optional)" type="number" min={1} max={10} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} placeholder="How challenging was it?" />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        {existing ? 'Update reflection' : "Save today's reflection"}
      </Button>
    </form>
  )
}

export function JourneyDetail() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activePhase, setActivePhase] = useState<JourneyPhase>('setup')
  const [practiceTab, setPracticeTab] = useState<PracticeTab>('Exposures')

  // Modals
  const [reflectionModal, setReflectionModal] = useState(false)
  const [editingReflection, setEditingReflection] = useState<Reflection | undefined>()
  const [exposureModal, setExposureModal] = useState(false)
  const [resolutionModal, setResolutionModal] = useState(false)
  const [challengeModal, setChallengeModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [pauseModal, setPauseModal] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [selectedInviteUser, setSelectedInviteUser] = useState<UserSearchItem | null>(null)
  const [dismissedGlobalPrompt, setDismissedGlobalPrompt] = useState(false)

  // Catalog picker extra fields
  const [resolutionFrequency, setResolutionFrequency] = useState('')
  const [challengeCriteria, setChallengeCriteria] = useState('')

  const { data: journey, isLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => journeysApi.get(journeyId!),
    enabled: !!journeyId,
  })

  const { data: reflections } = useQuery({
    queryKey: ['reflections', journeyId],
    queryFn: () => reflectionsApi.list(journeyId!),
    enabled: !!journeyId && activePhase === 'practice' && practiceTab === 'Reflections',
  })

  const { data: currentVratmitra } = useQuery({
    queryKey: ['vratmitra', journeyId],
    queryFn: () => vratmitraApi.getCurrent(journeyId!),
    enabled: !!journeyId && activePhase === 'setup',
  })

  const { data: globalVm } = useQuery({
    queryKey: ['global-vratmitra'],
    queryFn: vratmitraApi.getGlobal,
    enabled: activePhase === 'setup',
  })

  const { data: catalogExposures } = useQuery({
    queryKey: ['catalog-exposures', journey?.sentence_id],
    queryFn: () => activitiesApi.getCatalogExposures(journey!.sentence_id),
    enabled: !!journey?.sentence_id && exposureModal,
  })

  const { data: catalogResolutions } = useQuery({
    queryKey: ['catalog-resolutions', journey?.sentence_id],
    queryFn: () => activitiesApi.getCatalogResolutions(journey!.sentence_id),
    enabled: !!journey?.sentence_id && resolutionModal,
  })

  const { data: catalogChallenges } = useQuery({
    queryKey: ['catalog-challenges', journey?.sentence_id],
    queryFn: () => activitiesApi.getCatalogChallenges(journey!.sentence_id),
    enabled: !!journey?.sentence_id && challengeModal,
  })

  // ── Mutations ──

  const pauseMutation = useMutation({
    mutationFn: (reason?: string) => journeysApi.pause(journeyId!, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); setPauseModal(false); setPauseReason(''); toast.success('Journey paused') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const resumeMutation = useMutation({
    mutationFn: () => journeysApi.resume(journeyId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Journey resumed') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const completeMutation = useMutation({
    mutationFn: () => journeysApi.complete(journeyId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Journey completed!') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addExposureMutation = useMutation({
    mutationFn: (payload: { catalog_item_id?: string; title: string }) =>
      activitiesApi.addExposure(journeyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setExposureModal(false)
      toast.success('Exposure added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateExposureStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExposureStatus }) =>
      activitiesApi.updateExposure(journeyId!, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journey', journeyId] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteExposureMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.deleteExposure(journeyId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Exposure removed') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addResolutionMutation = useMutation({
    mutationFn: (payload: { catalog_item_id?: string; title: string; frequency: string }) =>
      activitiesApi.addResolution(journeyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setResolutionModal(false)
      setResolutionFrequency('')
      toast.success('Resolution added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateResolutionStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResolutionStatus }) =>
      activitiesApi.updateResolution(journeyId!, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journey', journeyId] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteResolutionMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.deleteResolution(journeyId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Resolution removed') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const addChallengeMutation = useMutation({
    mutationFn: (payload: { catalog_item_id?: string; title: string; achievement_criteria: string }) =>
      activitiesApi.addChallenge(journeyId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setChallengeModal(false)
      setChallengeCriteria('')
      toast.success('Challenge set')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const completeChallengeM = useMutation({
    mutationFn: () => activitiesApi.setChallengeOutcome(journeyId!, 'COMPLETED'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Challenge completed!') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const abandonChallengeM = useMutation({
    mutationFn: () => activitiesApi.setChallengeOutcome(journeyId!, 'ABANDONED'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Challenge abandoned') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteChallengeM = useMutation({
    mutationFn: () => activitiesApi.deleteChallenge(journeyId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Challenge removed') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const inviteMutation = useMutation({
    mutationFn: (inviteeId: string) => vratmitraApi.invite(journeyId!, { invitee_id: inviteeId }),
    onSuccess: () => {
      setInviteModal(false); setSelectedInviteUser(null)
      qc.invalidateQueries({ queryKey: ['vratmitra', journeyId] })
      toast.success('Invitation sent!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const detachMutation = useMutation({
    mutationFn: () => vratmitraApi.detach(journeyId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vratmitra', journeyId] }); toast.success('Vratmitra detached') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading || !journey) return <PageLoader />

  const isActive = journey.state === 'ACTIVE'
  const isInactive = journey.state === 'INACTIVE'
  const stateBadge = { ACTIVE: 'success', INACTIVE: 'warning', COMPLETED: 'info' } as const

  const hasActivities = journey.journey_exposures.length > 0 || journey.journey_resolutions.length > 0
  const challengeDone = journey.journey_challenge?.status === 'COMPLETED'

  const completedPhases = new Set<JourneyPhase>()
  if (hasActivities) completedPhases.add('setup')
  if (challengeDone) completedPhases.add('practice')

  return (
    <div className="animate-enter">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Journey header */}
      <div className="rounded-2xl bg-white border border-warm-200 shadow-card p-5 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {journey.sentence?.sub_virtue?.virtue && (
            <span className="text-xs text-stone-400">{journey.sentence.sub_virtue.virtue.name_en}</span>
          )}
          {journey.sentence?.sub_virtue?.virtue && <span className="text-stone-300 text-xs">›</span>}
          {journey.sentence?.sub_virtue && (
            <span className="text-xs text-stone-500 font-medium">{journey.sentence.sub_virtue.name_en}</span>
          )}
          <span className="ml-auto">
            <Badge variant={stateBadge[journey.state]}>{journey.state}</Badge>
          </span>
        </div>
        <p className="font-serif text-xl font-semibold text-stone-800 dark:text-[#ede8e0] leading-relaxed mb-2">{journey.sentence?.text_en}</p>
        <p className="font-serif text-base text-stone-500 dark:text-[#8b8576] italic mb-3">{journey.sentence?.text_mr}</p>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-warm-100">
          <p className="text-xs text-stone-400">
            Started {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
          </p>
          <div className="flex gap-2 flex-wrap">
            {isActive && (
              <>
                <Button size="sm" variant="secondary" onClick={() => { setPauseReason(''); setPauseModal(true) }}>
                  <Pause size={13} /> Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => completeMutation.mutate()}
                  loading={completeMutation.isPending}
                  disabled={!challengeDone}
                  title={!challengeDone ? 'Complete a challenge first' : undefined}
                >
                  <CheckCircle size={13} /> Complete
                </Button>
              </>
            )}
            {isInactive && (
              <Button size="sm" onClick={() => resumeMutation.mutate()} loading={resumeMutation.isPending}>
                <Play size={13} /> Resume
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Phase bar */}
      <div className="rounded-2xl bg-white border border-warm-200 shadow-card mb-4 overflow-hidden">
        <JourneyPhaseBar
          current={activePhase}
          completed={completedPhases}
          onSelect={setActivePhase}
        />
      </div>

      {/* ── SETUP PHASE ── */}
      {activePhase === 'setup' && (
        <div className="space-y-4 animate-enter">
          {/* Clarification card */}
          <ClarificationSetupCard
            journeyId={journeyId!}
            originatingAssessmentId={journey.originating_assessment_id}
            links={journey.links}
          />

          {/* Vratmitra section */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-stone-500" />
                <h3 className="text-sm font-semibold text-stone-800">Vratmitra</h3>
              </div>
              {isActive && !currentVratmitra && (
                <Button size="sm" variant="secondary" onClick={() => setInviteModal(true)}>
                  <Users size={13} /> Invite
                </Button>
              )}
            </div>

            {isActive && !currentVratmitra && !dismissedGlobalPrompt && globalVm?.status === 'ACTIVE' && (
              <div className="rounded-xl bg-sage-50 border border-sage-200 p-3 mb-3">
                <p className="text-sm font-medium text-stone-800 mb-2">
                  Continue with <span className="font-semibold">{globalVm.vratmitra?.name}</span> as Vratmitra?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => inviteMutation.mutate(globalVm.vratmitra_id)} loading={inviteMutation.isPending}>
                    <CheckCircle size={13} /> Yes, use them
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setDismissedGlobalPrompt(true)}>
                    Choose different
                  </Button>
                </div>
              </div>
            )}

            {currentVratmitra ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center">
                    <span className="font-bold text-sage-700 text-sm">
                      {currentVratmitra.user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{currentVratmitra.user?.name}</p>
                    <Badge variant="success" className="mt-0.5">Active</Badge>
                  </div>
                </div>
                {isActive && (
                  <Button variant="danger" size="sm" onClick={() => detachMutation.mutate()} loading={detachMutation.isPending}>
                    Detach
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No Vratmitra assigned. Optionally invite a mentor for this journey.</p>
            )}
          </Card>

          {/* Exposures setup */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-stone-500" />
                <h3 className="text-sm font-semibold text-stone-800">Exposures</h3>
                <span className="text-xs text-stone-400">({journey.journey_exposures.length})</span>
              </div>
              {isActive && (
                <Button size="sm" variant="secondary" onClick={() => setExposureModal(true)}>
                  <Plus size={13} /> Add
                </Button>
              )}
            </div>
            {journey.journey_exposures.length > 0 ? (
              <ExposureList
                items={journey.journey_exposures}
                editable={isActive}
                onStatusChange={(id, status) => updateExposureStatusMutation.mutate({ id, status })}
                onDelete={(id) => deleteExposureMutation.mutate(id)}
              />
            ) : (
              <p className="text-sm text-stone-400">
                Add exposures — learning activities you plan to do for this virtue.
              </p>
            )}
          </Card>

          {/* Resolutions setup */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={15} className="text-stone-500" />
                <h3 className="text-sm font-semibold text-stone-800">Resolutions</h3>
                <span className="text-xs text-stone-400">({journey.journey_resolutions.length})</span>
              </div>
              {isActive && (
                <Button size="sm" variant="secondary" onClick={() => setResolutionModal(true)}>
                  <Plus size={13} /> Add
                </Button>
              )}
            </div>
            {journey.journey_resolutions.length > 0 ? (
              <ResolutionList
                items={journey.journey_resolutions}
                editable={isActive}
                onStatusChange={(id, status) => updateResolutionStatusMutation.mutate({ id, status })}
                onDelete={(id) => deleteResolutionMutation.mutate(id)}
              />
            ) : (
              <p className="text-sm text-stone-400">
                Add resolutions — recurring commitments to practice this virtue.
              </p>
            )}
          </Card>

          {hasActivities && (
            <Button className="w-full" variant="secondary" onClick={() => setActivePhase('practice')}>
              Go to Practice phase →
            </Button>
          )}
        </div>
      )}

      {/* ── PRACTICE PHASE ── */}
      {activePhase === 'practice' && (
        <div className="animate-enter">
          {/* Practice sub-tabs */}
          <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 glass border-b border-warm-200 shadow-sticky mb-5">
            <div className="flex gap-0 overflow-x-auto no-scrollbar py-1">
              {PRACTICE_TABS.map((tab) => {
                const Icon = PRACTICE_TAB_ICONS[tab]
                return (
                  <button
                    key={tab}
                    onClick={() => setPracticeTab(tab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      practiceTab === tab
                        ? 'bg-white text-stone-800 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
                    }`}
                  >
                    <Icon size={14} /> {tab}
                  </button>
                )
              })}
            </div>
          </div>

          {practiceTab === 'Exposures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-800">Exposures</h2>
                {isActive && (
                  <Button size="sm" onClick={() => setExposureModal(true)}>
                    <Plus size={14} /> Add
                  </Button>
                )}
              </div>
              {journey.journey_exposures.length > 0 ? (
                <ExposureList
                  items={journey.journey_exposures}
                  editable={isActive}
                  onStatusChange={(id, status) => updateExposureStatusMutation.mutate({ id, status })}
                  onDelete={(id) => deleteExposureMutation.mutate(id)}
                />
              ) : (
                <EmptyState
                  icon={Eye}
                  title="No exposures yet"
                  description="Go to Setup to add exposures"
                  action={isActive ? (
                    <Button onClick={() => setExposureModal(true)}>
                      <Plus size={14} /> Add exposure
                    </Button>
                  ) : undefined}
                />
              )}
            </div>
          )}

          {practiceTab === 'Resolutions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-800">Resolutions</h2>
                {isActive && (
                  <Button size="sm" onClick={() => setResolutionModal(true)}>
                    <Plus size={14} /> Add
                  </Button>
                )}
              </div>
              {journey.journey_resolutions.length > 0 ? (
                <ResolutionList
                  items={journey.journey_resolutions}
                  editable={isActive}
                  onStatusChange={(id, status) => updateResolutionStatusMutation.mutate({ id, status })}
                  onDelete={(id) => deleteResolutionMutation.mutate(id)}
                />
              ) : (
                <EmptyState
                  icon={Lightbulb}
                  title="No resolutions yet"
                  description="Go to Setup to add resolutions"
                  action={isActive ? (
                    <Button onClick={() => setResolutionModal(true)}>
                      <Plus size={14} /> Add resolution
                    </Button>
                  ) : undefined}
                />
              )}
            </div>
          )}

          {practiceTab === 'Reflections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-800">Daily Reflections</h2>
                {isActive && (
                  <Button size="sm" onClick={() => { setEditingReflection(undefined); setReflectionModal(true) }}>
                    <Plus size={14} /> Today's reflection
                  </Button>
                )}
              </div>
              {reflections && reflections.length > 0 ? (
                <div className="space-y-3">
                  {reflections.map((r) => {
                    const isToday = format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    return (
                      <Card key={r.id} padding="md">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Calendar size={13} className="text-stone-400" />
                            <span className="text-sm font-semibold text-stone-700">
                              {format(new Date(r.date), 'MMMM d, yyyy')}
                              {isToday && <span className="ml-1.5 text-xs text-sage-600 font-medium">Today</span>}
                            </span>
                            <Badge variant={r.applied ? 'success' : 'warning'} className="text-xs">
                              {r.applied ? 'Applied' : 'Skipped'}
                            </Badge>
                            {r.difficulty && (
                              <span className="text-xs text-stone-400">Difficulty {r.difficulty}/10</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Context</p>
                            <p className="text-stone-700 leading-relaxed">{r.context_note}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Insight</p>
                            <p className="text-stone-700 leading-relaxed">{r.insight_note}</p>
                          </div>
                        </div>
                        {r.comments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-warm-100">
                            <p className="text-xs font-semibold text-stone-400 uppercase mb-2">
                              Mentor comments ({r.comments.length})
                            </p>
                            {r.comments.map((c) => (
                              <div key={c.id} className="flex gap-2 text-xs text-stone-600 mb-1.5 p-2 bg-warm-50 rounded-lg">
                                <span className="font-semibold text-stone-700">{c.user?.name}:</span>
                                <span>{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No reflections yet"
                  description="Start reflecting daily on how you're applying this sentence"
                  action={isActive ? (
                    <Button onClick={() => setReflectionModal(true)}>
                      <Plus size={14} /> Add first reflection
                    </Button>
                  ) : undefined}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CHALLENGE PHASE ── */}
      {activePhase === 'challenge' && (
        <div className="space-y-4 animate-enter">
          <ChallengeCard
            challenge={journey.journey_challenge}
            editable={isActive}
            onComplete={() => completeChallengeM.mutate()}
            onAbandon={() => abandonChallengeM.mutate()}
            onDelete={() => deleteChallengeM.mutate()}
            onAdd={() => setChallengeModal(true)}
            completing={completeChallengeM.isPending}
            abandoning={abandonChallengeM.isPending}
            deleting={deleteChallengeM.isPending}
          />

          {challengeDone && isActive && (
            <div className="rounded-2xl bg-sage-50 border border-sage-200 p-5 text-center">
              <CheckCircle size={24} className="text-sage-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-800 mb-1">Challenge completed!</p>
              <p className="text-xs text-stone-500 mb-4">You can now mark this journey as complete.</p>
              <Button onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}>
                <CheckCircle size={14} /> Complete journey
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={reflectionModal} onClose={() => { setReflectionModal(false); setEditingReflection(undefined) }} title={editingReflection ? 'Edit reflection' : "Today's reflection"}>
        <ReflectionForm journeyId={journeyId!} existing={editingReflection} onSuccess={() => { setReflectionModal(false); setEditingReflection(undefined) }} />
      </Modal>

      <Modal open={exposureModal} onClose={() => setExposureModal(false)} title="Add exposure">
        <CatalogPicker
          items={catalogExposures ?? []}
          loading={addExposureMutation.isPending}
          onSelect={(item) => addExposureMutation.mutate({ catalog_item_id: item.id, title: item.title })}
          onAddCustom={(title) => addExposureMutation.mutate({ title })}
        />
      </Modal>

      <Modal open={resolutionModal} onClose={() => { setResolutionModal(false); setResolutionFrequency('') }} title="Add resolution">
        <CatalogPicker
          items={catalogResolutions ?? []}
          loading={addResolutionMutation.isPending}
          extraField={{
            label: 'Frequency',
            placeholder: 'e.g. Daily, Weekly, When triggered',
            value: resolutionFrequency,
            onChange: setResolutionFrequency,
            required: true,
          }}
          onSelect={(item) =>
            resolutionFrequency.trim() &&
            addResolutionMutation.mutate({
              catalog_item_id: item.id,
              title: item.title,
              frequency: resolutionFrequency.trim(),
            })
          }
          onAddCustom={(title) =>
            resolutionFrequency.trim() &&
            addResolutionMutation.mutate({ title, frequency: resolutionFrequency.trim() })
          }
        />
      </Modal>

      <Modal open={challengeModal} onClose={() => { setChallengeModal(false); setChallengeCriteria('') }} title="Set challenge">
        <CatalogPicker
          items={catalogChallenges ?? []}
          loading={addChallengeMutation.isPending}
          extraField={{
            label: 'Achievement criteria',
            placeholder: 'How will you know you succeeded?',
            value: challengeCriteria,
            onChange: setChallengeCriteria,
            required: true,
          }}
          onSelect={(item) =>
            challengeCriteria.trim() &&
            addChallengeMutation.mutate({
              catalog_item_id: item.id,
              title: item.title,
              achievement_criteria: item.achievement_criteria ?? challengeCriteria.trim(),
            })
          }
          onAddCustom={(title) =>
            challengeCriteria.trim() &&
            addChallengeMutation.mutate({ title, achievement_criteria: challengeCriteria.trim() })
          }
        />
      </Modal>

      <Modal open={pauseModal} onClose={() => { setPauseModal(false); setPauseReason('') }} title="Pause journey" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Why are you pausing? (optional)</p>
          <Textarea value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="e.g. Taking a break..." rows={3} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setPauseModal(false); setPauseReason('') }}>Cancel</Button>
            <Button variant="primary" className="flex-1" loading={pauseMutation.isPending} onClick={() => pauseMutation.mutate(pauseReason.trim() || undefined)}>
              <Pause size={13} /> Pause
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteModal} onClose={() => { setInviteModal(false); setSelectedInviteUser(null) }} title="Invite Vratmitra" description="Search and invite someone as your accountability mentor">
        <div className="space-y-4">
          <UserSearchCombobox onSelect={setSelectedInviteUser} placeholder="Search by name or email..." />
          {selectedInviteUser && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sage-50 border border-sage-200">
              <UserCheck size={14} className="text-sage-600" />
              <p className="text-sm text-stone-800 font-medium">{selectedInviteUser.name}</p>
              <p className="text-xs text-stone-400">{selectedInviteUser.email}</p>
            </div>
          )}
          <Button className="w-full" disabled={!selectedInviteUser} loading={inviteMutation.isPending} onClick={() => selectedInviteUser && inviteMutation.mutate(selectedInviteUser.id)}>
            Send invitation
          </Button>
        </div>
      </Modal>
    </div>
  )
}
