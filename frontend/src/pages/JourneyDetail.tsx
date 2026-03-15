import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BookOpen, Plus, Edit2, Trash2, Pause, Play, CheckCircle,
  Eye, Users, ArrowLeft, Calendar, FileText
} from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { reflectionsApi } from '../api/reflections'
import { exposuresApi } from '../api/exposures'
import { vratmitraApi } from '../api/vratmitra'
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Reflections', 'Exposures', 'Resolutions', 'Vratmitra'] as const
type Tab = (typeof TABS)[number]

// ─── Reflection Form ──────────────────────────────────────────────────────────

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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Did you apply this sentence today?
        </label>
        <div className="flex gap-3">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setForm({ ...form, applied: v })}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                form.applied === v
                  ? v
                    ? 'bg-sage-100 text-sage-700 border-sage-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-white text-stone-600 border-warm-200 hover:bg-warm-50'
              }`}
            >
              {v ? 'Yes, I did' : 'Not today'}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Context — what happened?"
        value={form.context_note}
        onChange={(e) => setForm({ ...form, context_note: e.target.value })}
        placeholder="Describe the situation or context..."
        rows={3}
        required
      />

      <Textarea
        label="Insight — what did you learn?"
        value={form.insight_note}
        onChange={(e) => setForm({ ...form, insight_note: e.target.value })}
        placeholder="What insight or awareness arose..."
        rows={3}
        required
      />

      <Input
        label="Difficulty (1–10, optional)"
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

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [inviteEmail, setInviteEmail] = useState('')
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

  // Journey state mutations
  const pauseMutation = useMutation({
    mutationFn: () => journeysApi.pause(journeyId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      toast.success('Journey paused')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const resumeMutation = useMutation({
    mutationFn: () => journeysApi.resume(journeyId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      toast.success('Journey resumed')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const completeMutation = useMutation({
    mutationFn: () => journeysApi.complete(journeyId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      toast.success('Journey completed!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // Resolution mutations
  const addResolutionMutation = useMutation({
    mutationFn: () => journeysApi.addResolution(journeyId!, resolutionForm.text, resolutionForm.frequency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setResolutionModal(false)
      setResolutionForm({ text: '', frequency: '' })
      toast.success('Resolution added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateResolutionMutation = useMutation({
    mutationFn: () =>
      journeysApi.updateResolution(
        journeyId!,
        editingResolution!.id,
        resolutionForm.text,
        resolutionForm.frequency
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      setResolutionModal(false)
      setEditingResolution(undefined)
      toast.success('Resolution updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteResolutionMutation = useMutation({
    mutationFn: (id: string) => journeysApi.deleteResolution(journeyId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journey', journeyId] })
      toast.success('Resolution removed')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // Exposure mutations
  const addExposureMutation = useMutation({
    mutationFn: () =>
      exposuresApi.create(journeyId!, exposureForm.description, exposureForm.context_note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exposures', journeyId] })
      setExposureModal(false)
      setExposureForm({ description: '', context_note: '' })
      toast.success('Exposure added')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateExposureMutation = useMutation({
    mutationFn: () =>
      exposuresApi.update(journeyId!, editingExposure!.id, exposureForm.description, exposureForm.context_note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exposures', journeyId] })
      setExposureModal(false)
      setEditingExposure(undefined)
      toast.success('Exposure updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteExposureMutation = useMutation({
    mutationFn: (id: string) => exposuresApi.delete(journeyId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exposures', journeyId] })
      toast.success('Exposure deleted')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // Vratmitra mutations
  const inviteMutation = useMutation({
    mutationFn: () => vratmitraApi.invite(journeyId!, inviteEmail),
    onSuccess: () => {
      setInviteModal(false)
      setInviteEmail('')
      toast.success('Invitation sent!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const detachMutation = useMutation({
    mutationFn: () => vratmitraApi.detach(journeyId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vratmitra', journeyId] })
      toast.success('Vratmitra detached')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading || !journey) return <PageLoader />

  const isActive = journey.state === 'ACTIVE'
  const isInactive = journey.state === 'INACTIVE'
  const hasClarification = journey.links.length > 0

  const stateColors: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    COMPLETED: 'info',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate('/journeys')}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <ArrowLeft size={14} />
        All journeys
      </button>

      {/* Journey header */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge variant={stateColors[journey.state] as 'success' | 'warning' | 'info'}>
                {journey.state}
              </Badge>
              {journey.sentence?.sub_virtue && (
                <Badge variant="muted">{journey.sentence.sub_virtue.name_en}</Badge>
              )}
              {journey.sentence?.sub_virtue?.virtue && (
                <Badge variant="muted">{journey.sentence.sub_virtue.virtue.name_en}</Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-stone-800 leading-snug mb-1">
              {journey.sentence?.text_en}
            </h1>
            <p className="text-sm text-stone-500 italic">{journey.sentence?.text_mr}</p>
            <p className="text-xs text-stone-400 mt-2">
              Started {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* State actions */}
          <div className="flex gap-2 flex-wrap">
            {isActive && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => pauseMutation.mutate()}
                  loading={pauseMutation.isPending}
                >
                  <Pause size={14} /> Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => completeMutation.mutate()}
                  loading={completeMutation.isPending}
                >
                  <CheckCircle size={14} /> Complete
                </Button>
              </>
            )}
            {isInactive && (
              <Button
                size="sm"
                onClick={() => resumeMutation.mutate()}
                loading={resumeMutation.isPending}
              >
                <Play size={14} /> Resume
              </Button>
            )}
            {isActive && !hasClarification && (
              <Link to={`/journeys/${journeyId}/clarify`}>
                <Button size="sm">
                  <FileText size={14} /> Add clarification
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {/* Clarification links */}
          {journey.links.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Clarifications</h2>
              {journey.links.map((link) => (
                <Card key={link.id} padding="md" className="mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {link.virtue_relation_note && (
                      <div>
                        <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                          Virtue relation
                        </p>
                        <p className="text-stone-700">{link.virtue_relation_note}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                        Lacuna reduction
                      </p>
                      <p className="text-stone-700">{link.lacuna_reduction_note}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                        Personal context
                      </p>
                      <p className="text-stone-700">{link.personal_context_note}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                        Unified insight
                      </p>
                      <p className="text-stone-700">{link.unified_insight_note}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                        Irrational belief addressed
                      </p>
                      <Badge variant="default">{link.irrational_belief.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <div className="text-center py-6">
                <FileText size={24} className="text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-600 font-medium">No clarification yet</p>
                <p className="text-xs text-stone-400 mt-1 mb-4">
                  Clarification is required before you can add resolutions
                </p>
                {isActive && (
                  <Link to={`/journeys/${journeyId}/clarify`}>
                    <Button size="sm">Add clarification</Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'Reflections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-800">Daily Reflections</h2>
            {isActive && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingReflection(undefined)
                  setReflectionModal(true)
                }}
              >
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
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-stone-400" />
                        <span className="text-sm font-medium text-stone-700">
                          {format(new Date(r.date), 'MMMM d, yyyy')}
                          {isToday && ' (Today)'}
                        </span>
                        <Badge variant={r.applied ? 'success' : 'warning'}>
                          {r.applied ? 'Applied' : 'Not applied'}
                        </Badge>
                        {r.difficulty && (
                          <Badge variant="muted">Difficulty: {r.difficulty}/10</Badge>
                        )}
                      </div>
                      {isToday && isActive && (
                        <button
                          onClick={() => {
                            setEditingReflection(r)
                            setReflectionModal(true)
                          }}
                          className="p-1.5 rounded text-stone-400 hover:text-stone-600 hover:bg-warm-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Context</p>
                        <p className="text-stone-700">{r.context_note}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Insight</p>
                        <p className="text-stone-700">{r.insight_note}</p>
                      </div>
                    </div>
                    {r.comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-warm-100">
                        <p className="text-xs font-semibold text-stone-500 uppercase mb-2">
                          Comments ({r.comments.length})
                        </p>
                        {r.comments.map((c) => (
                          <div key={c.id} className="flex gap-2 text-xs text-stone-600 mb-1.5">
                            <span className="font-medium">{c.user?.name}:</span>
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
              action={
                isActive ? (
                  <Button onClick={() => setReflectionModal(true)}>
                    <Plus size={14} /> Add first reflection
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {activeTab === 'Exposures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-800">Exposures</h2>
            {isActive && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingExposure(undefined)
                  setExposureForm({ description: '', context_note: '' })
                  setExposureModal(true)
                }}
              >
                <Plus size={14} /> Add exposure
              </Button>
            )}
          </div>

          {exposures && exposures.length > 0 ? (
            <div className="space-y-3">
              {exposures.map((exp) => (
                <Card key={exp.id} padding="md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-stone-800 font-medium">{exp.description}</p>
                      {exp.context_note && (
                        <p className="text-xs text-stone-500 mt-1">{exp.context_note}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">
                        {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingExposure(exp)
                            setExposureForm({ description: exp.description, context_note: exp.context_note ?? '' })
                            setExposureModal(true)
                          }}
                          className="p-1.5 rounded text-stone-400 hover:text-stone-600 hover:bg-warm-100"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteExposureMutation.mutate(exp.id)}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
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
              action={
                isActive ? (
                  <Button onClick={() => setExposureModal(true)}>
                    <Plus size={14} /> Add exposure
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {activeTab === 'Resolutions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-800">Resolutions</h2>
            {isActive && hasClarification && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingResolution(undefined)
                  setResolutionForm({ text: '', frequency: '' })
                  setResolutionModal(true)
                }}
              >
                <Plus size={14} /> Add resolution
              </Button>
            )}
          </div>

          {!hasClarification && isActive && (
            <Card className="bg-amber-50 border-amber-100">
              <p className="text-sm text-amber-700">
                Complete your clarification before adding resolutions.
              </p>
            </Card>
          )}

          {journey.resolutions.length > 0 ? (
            <div className="space-y-3">
              {journey.resolutions.map((res) => (
                <Card key={res.id} padding="md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-stone-800 font-medium">{res.text}</p>
                      <Badge variant="muted" className="mt-1.5">{res.frequency}</Badge>
                    </div>
                    {isActive && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingResolution(res)
                            setResolutionForm({ text: res.text, frequency: res.frequency })
                            setResolutionModal(true)
                          }}
                          className="p-1.5 rounded text-stone-400 hover:text-stone-600 hover:bg-warm-100"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteResolutionMutation.mutate(res.id)}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No resolutions yet"
              description="Add concrete commitments for how you'll apply this sentence"
            />
          )}
        </div>
      )}

      {activeTab === 'Vratmitra' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-800">Vratmitra (Mentor)</h2>
            {isActive && !currentVratmitra && (
              <Button size="sm" onClick={() => setInviteModal(true)}>
                <Users size={14} /> Invite mentor
              </Button>
            )}
          </div>

          {currentVratmitra ? (
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                    <span className="font-semibold text-sage-700">
                      {currentVratmitra.user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{currentVratmitra.user?.name}</p>
                    <p className="text-xs text-stone-500">{currentVratmitra.user?.email}</p>
                    <Badge variant="success" className="mt-1">Active mentor</Badge>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => detachMutation.mutate()}
                  loading={detachMutation.isPending}
                >
                  Detach
                </Button>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={Users}
              title="No active Vratmitra"
              description="Invite someone to be your accountability mentor for this journey"
              action={
                isActive ? (
                  <Button onClick={() => setInviteModal(true)}>
                    <Users size={14} /> Invite mentor
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* Modals */}
      <Modal
        open={reflectionModal}
        onClose={() => {
          setReflectionModal(false)
          setEditingReflection(undefined)
        }}
        title={editingReflection ? 'Edit reflection' : "Today's reflection"}
      >
        <ReflectionForm
          journeyId={journeyId!}
          existing={editingReflection}
          onSuccess={() => {
            setReflectionModal(false)
            setEditingReflection(undefined)
          }}
        />
      </Modal>

      <Modal
        open={exposureModal}
        onClose={() => {
          setExposureModal(false)
          setEditingExposure(undefined)
        }}
        title={editingExposure ? 'Edit exposure' : 'Add exposure'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editingExposure) updateExposureMutation.mutate()
            else addExposureMutation.mutate()
          }}
          className="space-y-4"
        >
          <Textarea
            label="Description"
            value={exposureForm.description}
            onChange={(e) => setExposureForm({ ...exposureForm, description: e.target.value })}
            placeholder="Describe the practice situation..."
            rows={3}
            required
          />
          <Textarea
            label="Context (optional)"
            value={exposureForm.context_note}
            onChange={(e) => setExposureForm({ ...exposureForm, context_note: e.target.value })}
            placeholder="Any additional context..."
            rows={2}
          />
          <Button
            type="submit"
            className="w-full"
            loading={addExposureMutation.isPending || updateExposureMutation.isPending}
          >
            {editingExposure ? 'Update' : 'Add exposure'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={resolutionModal}
        onClose={() => {
          setResolutionModal(false)
          setEditingResolution(undefined)
        }}
        title={editingResolution ? 'Edit resolution' : 'Add resolution'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editingResolution) updateResolutionMutation.mutate()
            else addResolutionMutation.mutate()
          }}
          className="space-y-4"
        >
          <Textarea
            label="Resolution text"
            value={resolutionForm.text}
            onChange={(e) => setResolutionForm({ ...resolutionForm, text: e.target.value })}
            placeholder="How will you apply this sentence?"
            rows={3}
            required
          />
          <Input
            label="Frequency"
            value={resolutionForm.frequency}
            onChange={(e) => setResolutionForm({ ...resolutionForm, frequency: e.target.value })}
            placeholder="e.g. Daily, Weekly, When triggered"
            required
          />
          <Button
            type="submit"
            className="w-full"
            loading={addResolutionMutation.isPending || updateResolutionMutation.isPending}
          >
            {editingResolution ? 'Update resolution' : 'Add resolution'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={inviteModal}
        onClose={() => {
          setInviteModal(false)
          setInviteEmail('')
        }}
        title="Invite Vratmitra"
        description="Invite someone to be your accountability mentor for this journey"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            inviteMutation.mutate()
          }}
          className="space-y-4"
        >
          <Input
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="mentor@example.com"
            required
          />
          <Button
            type="submit"
            className="w-full"
            loading={inviteMutation.isPending}
          >
            Send invitation
          </Button>
        </form>
      </Modal>
    </div>
  )
}
