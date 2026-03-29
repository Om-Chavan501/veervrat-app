import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BookOpen, Plus, Edit2, Trash2, Pause, Play, CheckCircle,
  Eye, Users, ArrowLeft, Calendar, FileText, Lightbulb, Shield, UserCheck
} from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { reflectionsApi } from '../api/reflections'
import { exposuresApi } from '../api/exposures'
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
import { formatDistanceToNow, format } from 'date-fns'
import type { Reflection, Exposure, Resolution } from '../types'

const TABS = ['Overview', 'Reflections', 'Exposures', 'Resolutions', 'Vratmitra'] as const
type Tab = (typeof TABS)[number]

const TAB_ICONS: Record<Tab, React.ElementType> = {
  Overview: FileText,
  Reflections: BookOpen,
  Exposures: Eye,
  Resolutions: Lightbulb,
  Vratmitra: Shield,
}

function ReflectionForm({
  journeyId,
  existing,
  onSuccess,
}: {
  journeyId: string
  existing?: Reflection
  onSuccess: () => void
}) {
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
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Did you apply this sentence today?
        </label>
        <div className="flex gap-3">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setForm({ ...form, applied: v })}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                form.applied === v
                  ? v
                    ? 'bg-sage-100 text-sage-700 border-sage-300'
                    : 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-stone-600 border-warm-200 hover:bg-warm-50'
              }`}
            >
              {v ? '✓ Yes, I did' : '✗ Not today'}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        label="What happened? (context)"
        value={form.context_note}
        onChange={(e) => setForm({ ...form, context_note: e.target.value })}
        placeholder="Describe the situation..."
        rows={3}
        required
      />
      <Textarea
        label="What did you learn? (insight)"
        value={form.insight_note}
        onChange={(e) => setForm({ ...form, insight_note: e.target.value })}
        placeholder="What insight or awareness arose..."
        rows={3}
        required
      />
      <Input
        label="Difficulty 1–10 (optional)"
        type="number"
        min={1}
        max={10}
        value={form.difficulty}
        onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
        placeholder="How challenging was it?"
      />
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
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [reflectionModal, setReflectionModal] = useState(false)
  const [exposureModal, setExposureModal] = useState(false)
  const [resolutionModal, setResolutionModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [editingReflection, setEditingReflection] = useState<Reflection | undefined>()
  const [editingExposure, setEditingExposure] = useState<Exposure | undefined>()
  const [editingResolution, setEditingResolution] = useState<Resolution | undefined>()
  const [pauseModal, setPauseModal] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [selectedInviteUser, setSelectedInviteUser] = useState<UserSearchItem | null>(null)
  const [dismissedGlobalPrompt, setDismissedGlobalPrompt] = useState(false)
  const [exposureForm, setExposureForm] = useState({ description: '', context_note: '' })
  const [resolutionForm, setResolutionForm] = useState({ text: '', frequency: '' })

  const { data: journey, isLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => journeysApi.get(journeyId!),
    enabled: !!journeyId,
  })

  const { data: reflections } = useQuery({
    queryKey: ['reflections', journeyId],
    queryFn: () => reflectionsApi.list(journeyId!),
    enabled: !!journeyId && activeTab === 'Reflections',
  })

  const { data: exposures } = useQuery({
    queryKey: ['exposures', journeyId],
    queryFn: () => exposuresApi.list(journeyId!),
    enabled: !!journeyId && activeTab === 'Exposures',
  })

  const { data: currentVratmitra } = useQuery({
    queryKey: ['vratmitra', journeyId],
    queryFn: () => vratmitraApi.getCurrent(journeyId!),
    enabled: !!journeyId && activeTab === 'Vratmitra',
  })

  const { data: globalVm } = useQuery({
    queryKey: ['global-vratmitra'],
    queryFn: vratmitraApi.getGlobal,
    enabled: activeTab === 'Vratmitra',
  })

  const pauseMutation = useMutation({
    mutationFn: (reason?: string) => journeysApi.pause(journeyId!, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setPauseModal(false)
      setPauseReason('')
      toast.success('Journey paused')
    },
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
  const addResolutionMutation = useMutation({
    mutationFn: () => journeysApi.addResolution(journeyId!, resolutionForm.text, resolutionForm.frequency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setResolutionModal(false); setResolutionForm({ text: '', frequency: '' })
      toast.success('Resolution added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateResolutionMutation = useMutation({
    mutationFn: () => journeysApi.updateResolution(journeyId!, editingResolution!.id, resolutionForm.text, resolutionForm.frequency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setResolutionModal(false); setEditingResolution(undefined)
      toast.success('Resolution updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteResolutionMutation = useMutation({
    mutationFn: (id: string) => journeysApi.deleteResolution(journeyId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journey', journeyId] }); toast.success('Resolution removed') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const addExposureMutation = useMutation({
    mutationFn: () => exposuresApi.create(journeyId!, exposureForm.description, exposureForm.context_note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exposures', journeyId] })
      setExposureModal(false); setExposureForm({ description: '', context_note: '' })
      toast.success('Exposure added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const updateExposureMutation = useMutation({
    mutationFn: () => exposuresApi.update(journeyId!, editingExposure!.id, exposureForm.description, exposureForm.context_note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exposures', journeyId] })
      setExposureModal(false); setEditingExposure(undefined)
      toast.success('Exposure updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const deleteExposureMutation = useMutation({
    mutationFn: (id: string) => exposuresApi.delete(journeyId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exposures', journeyId] }); toast.success('Exposure deleted') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const inviteMutation = useMutation({
    mutationFn: (inviteeId: string) => vratmitraApi.invite(journeyId!, { invitee_id: inviteeId }),
    onSuccess: () => {
      setInviteModal(false)
      setSelectedInviteUser(null)
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
  const hasClarification = journey.links.length > 0

  const stateBadge = { ACTIVE: 'success', INACTIVE: 'warning', COMPLETED: 'info' } as const

  return (
    <div className="animate-fade-in">
      {/* ── Back link ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* ── Journey header card ── */}
      <div className="rounded-2xl bg-white border border-warm-200 shadow-card p-5 mb-4">
        {/* Virtue path */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {journey.sentence?.sub_virtue?.virtue && (
            <span className="text-xs text-stone-400">{journey.sentence.sub_virtue.virtue.name_en}</span>
          )}
          {journey.sentence?.sub_virtue?.virtue && (
            <span className="text-stone-300 text-xs">›</span>
          )}
          {journey.sentence?.sub_virtue && (
            <span className="text-xs text-stone-500 font-medium">{journey.sentence.sub_virtue.name_en}</span>
          )}
          <span className="ml-auto">
            <Badge variant={stateBadge[journey.state]}>{journey.state}</Badge>
          </span>
        </div>

        {/* Sentence */}
        <p className="text-base font-bold text-stone-800 leading-snug mb-1">
          {journey.sentence?.text_en}
        </p>
        <p className="text-sm text-stone-400 italic mb-3">{journey.sentence?.text_mr}</p>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-warm-100">
          <p className="text-xs text-stone-400">
            Started {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
          </p>

          {/* State actions */}
          <div className="flex gap-2 flex-wrap">
            {isActive && !hasClarification && (
              <Link to={`/journeys/${journeyId}/clarify`}>
                <Button size="sm" variant="secondary">
                  <FileText size={13} /> Clarify
                </Button>
              </Link>
            )}
            {isActive && (
              <>
                <Button size="sm" variant="secondary" onClick={() => { setPauseReason(journey.inactive_reason ?? ''); setPauseModal(true) }}>
                  <Pause size={13} /> Pause
                </Button>
                <Button size="sm" variant="outline" onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}>
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

      {/* ── Sticky tabs ── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 glass border-b border-warm-200 shadow-sticky mb-5">
        <div className="flex gap-0 overflow-x-auto no-scrollbar py-1">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
                }`}
              >
                <Icon size={14} />
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="animate-fade-in">

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            {journey.links.length > 0 ? (
              journey.links.map((link) => (
                <div key={link.id} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'Lacuna reduction', value: link.lacuna_reduction_note },
                      { label: 'Personal context', value: link.personal_context_note },
                      { label: 'Unified insight', value: link.unified_insight_note },
                      link.virtue_relation_note ? { label: 'Virtue relation', value: link.virtue_relation_note } : null,
                    ].filter(Boolean).map((item) => (
                      <Card key={item!.label} padding="md">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{item!.label}</p>
                        <p className="text-sm text-stone-700 leading-relaxed">{item!.value}</p>
                      </Card>
                    ))}
                  </div>
                  <Card padding="md">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Irrational belief addressed</p>
                    <Badge variant="default">{link.irrational_belief.replace(/_/g, ' ')}</Badge>
                  </Card>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50 p-8 text-center">
                <FileText size={24} className="text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-stone-600 mb-1">No clarification yet</p>
                <p className="text-xs text-stone-400 mb-4">
                  Clarification is required before you can add resolutions
                </p>
                {isActive && (
                  <Link to={`/journeys/${journeyId}/clarify`}>
                    <Button size="sm">Add clarification</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reflections */}
        {activeTab === 'Reflections' && (
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
                        {isToday && isActive && (
                          <button
                            onClick={() => { setEditingReflection(r); setReflectionModal(true) }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-warm-100 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
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

        {/* Exposures */}
        {activeTab === 'Exposures' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-800">Exposures</h2>
              {isActive && (
                <Button size="sm" onClick={() => { setEditingExposure(undefined); setExposureForm({ description: '', context_note: '' }); setExposureModal(true) }}>
                  <Plus size={14} /> Add exposure
                </Button>
              )}
            </div>

            {exposures && exposures.length > 0 ? (
              <div className="space-y-3">
                {exposures.map((exp) => (
                  <Card key={exp.id} padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 leading-snug">{exp.description}</p>
                        {exp.context_note && (
                          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{exp.context_note}</p>
                        )}
                        <p className="text-xs text-stone-400 mt-2">
                          {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {isActive && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditingExposure(exp); setExposureForm({ description: exp.description, context_note: exp.context_note ?? '' }); setExposureModal(true) }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-warm-100 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteExposureMutation.mutate(exp.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Eye}
                title="No exposures yet"
                description="Record real-world practice situations related to this sentence"
                action={isActive ? (
                  <Button onClick={() => setExposureModal(true)}>
                    <Plus size={14} /> Add exposure
                  </Button>
                ) : undefined}
              />
            )}
          </div>
        )}

        {/* Resolutions */}
        {activeTab === 'Resolutions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-800">Resolutions</h2>
              {isActive && hasClarification && (
                <Button size="sm" onClick={() => { setEditingResolution(undefined); setResolutionForm({ text: '', frequency: '' }); setResolutionModal(true) }}>
                  <Plus size={14} /> Add resolution
                </Button>
              )}
            </div>

            {!hasClarification && isActive && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
                <FileText size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Clarification required first</p>
                  <p className="text-xs text-amber-700 mt-0.5">Complete your clarification on the Overview tab before adding resolutions.</p>
                </div>
              </div>
            )}

            {journey.resolutions.length > 0 ? (
              <div className="space-y-3">
                {journey.resolutions.map((res) => (
                  <Card key={res.id} padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 leading-snug mb-2">{res.text}</p>
                        <Badge variant="muted">{res.frequency}</Badge>
                      </div>
                      {isActive && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditingResolution(res); setResolutionForm({ text: res.text, frequency: res.frequency }); setResolutionModal(true) }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-warm-100 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteResolutionMutation.mutate(res.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No resolutions yet" description="Add concrete commitments for how you'll apply this sentence" />
            )}
          </div>
        )}

        {/* Vratmitra */}
        {activeTab === 'Vratmitra' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-800">Vratmitra</h2>
              {isActive && !currentVratmitra && (
                <Button size="sm" onClick={() => setInviteModal(true)}>
                  <Users size={14} /> Invite mentor
                </Button>
              )}
            </div>

            {/* Global VM prompt */}
            {isActive && !currentVratmitra && !dismissedGlobalPrompt && globalVm?.status === 'ACTIVE' && (
              <Card padding="md" className="border-sage-200 bg-sage-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <UserCheck size={16} className="text-sage-600" />
                  <p className="text-sm font-medium text-stone-800">
                    Continue with <span className="font-semibold">{globalVm.vratmitra?.name}</span> as Vratmitra for this journey?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => inviteMutation.mutate(globalVm.vratmitra_id)}
                    loading={inviteMutation.isPending}
                  >
                    <CheckCircle size={13} /> Yes, use them
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setDismissedGlobalPrompt(true)}>
                    Choose different
                  </Button>
                </div>
              </Card>
            )}

            {currentVratmitra ? (
              <Card padding="md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-sage-100 flex items-center justify-center">
                      <span className="font-bold text-sage-700">
                        {currentVratmitra.user?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{currentVratmitra.user?.name}</p>
                      <p className="text-xs text-stone-500">{currentVratmitra.user?.email}</p>
                      <Badge variant="success" className="mt-1.5">Active mentor</Badge>
                    </div>
                  </div>
                  {isActive && (
                    <Button variant="danger" size="sm" onClick={() => detachMutation.mutate()} loading={detachMutation.isPending}>
                      Detach
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              (!globalVm?.status || globalVm.status !== 'ACTIVE' || dismissedGlobalPrompt) && (
                <EmptyState
                  icon={Users}
                  title="No active Vratmitra"
                  description="Invite someone to be your accountability mentor for this journey"
                  action={isActive ? (
                    <Button onClick={() => setInviteModal(true)}>
                      <Users size={14} /> Invite mentor
                    </Button>
                  ) : undefined}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <Modal open={reflectionModal} onClose={() => { setReflectionModal(false); setEditingReflection(undefined) }} title={editingReflection ? 'Edit reflection' : "Today's reflection"}>
        <ReflectionForm journeyId={journeyId!} existing={editingReflection} onSuccess={() => { setReflectionModal(false); setEditingReflection(undefined) }} />
      </Modal>

      <Modal open={exposureModal} onClose={() => { setExposureModal(false); setEditingExposure(undefined) }} title={editingExposure ? 'Edit exposure' : 'Add exposure'}>
        <form onSubmit={(e) => { e.preventDefault(); if (editingExposure) updateExposureMutation.mutate(); else addExposureMutation.mutate() }} className="space-y-4">
          <Textarea label="Description" value={exposureForm.description} onChange={(e) => setExposureForm({ ...exposureForm, description: e.target.value })} placeholder="Describe the practice situation..." rows={3} required />
          <Textarea label="Context (optional)" value={exposureForm.context_note} onChange={(e) => setExposureForm({ ...exposureForm, context_note: e.target.value })} placeholder="Any additional context..." rows={2} />
          <Button type="submit" className="w-full" loading={addExposureMutation.isPending || updateExposureMutation.isPending}>
            {editingExposure ? 'Update' : 'Add exposure'}
          </Button>
        </form>
      </Modal>

      <Modal open={resolutionModal} onClose={() => { setResolutionModal(false); setEditingResolution(undefined) }} title={editingResolution ? 'Edit resolution' : 'Add resolution'}>
        <form onSubmit={(e) => { e.preventDefault(); if (editingResolution) updateResolutionMutation.mutate(); else addResolutionMutation.mutate() }} className="space-y-4">
          <Textarea label="Resolution" value={resolutionForm.text} onChange={(e) => setResolutionForm({ ...resolutionForm, text: e.target.value })} placeholder="How will you apply this sentence?" rows={3} required />
          <Input label="Frequency" value={resolutionForm.frequency} onChange={(e) => setResolutionForm({ ...resolutionForm, frequency: e.target.value })} placeholder="e.g. Daily, Weekly, When triggered" required />
          <Button type="submit" className="w-full" loading={addResolutionMutation.isPending || updateResolutionMutation.isPending}>
            {editingResolution ? 'Update' : 'Add resolution'}
          </Button>
        </form>
      </Modal>

      <Modal open={pauseModal} onClose={() => { setPauseModal(false); setPauseReason('') }} title="Pause journey" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Why are you pausing this journey? (optional — helps you remember when you resume)
          </p>
          <Textarea
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="e.g. Taking a break, too busy right now, revisiting later..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setPauseModal(false); setPauseReason('') }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={pauseMutation.isPending}
              onClick={() => pauseMutation.mutate(pauseReason.trim() || undefined)}
            >
              <Pause size={13} /> Pause journey
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteModal} onClose={() => { setInviteModal(false); setSelectedInviteUser(null) }} title="Invite Vratmitra" description="Search and invite someone to be your accountability mentor">
        <div className="space-y-4">
          <UserSearchCombobox onSelect={setSelectedInviteUser} placeholder="Search by name or email..." />
          {selectedInviteUser && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sage-50 border border-sage-200">
              <UserCheck size={14} className="text-sage-600" />
              <p className="text-sm text-stone-800 font-medium">{selectedInviteUser.name}</p>
              <p className="text-xs text-stone-400">{selectedInviteUser.email}</p>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!selectedInviteUser}
            loading={inviteMutation.isPending}
            onClick={() => selectedInviteUser && inviteMutation.mutate(selectedInviteUser.id)}
          >
            Send invitation
          </Button>
        </div>
      </Modal>
    </div>
  )
}
