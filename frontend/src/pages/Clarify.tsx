import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react'
import { journeysApi } from '../api/journeys'
import { assessmentsApi } from '../api/assessments'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getErrorMessage } from '../api/client'

export function Clarify() {
  const { journeyId, assessmentId } = useParams<{ journeyId: string; assessmentId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    virtue_relation_note: '',
    lacuna_reduction_note: '',
    unified_insight_note: '',
    personal_context_note: '',
  })

  const { data: journey, isLoading: journeyLoading } = useQuery({
    queryKey: ['journey', journeyId],
    queryFn: () => journeysApi.get(journeyId!),
    enabled: !!journeyId,
  })

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId!),
    enabled: !!assessmentId,
  })

  // Fetch completed assessments only when no assessmentId in URL (picker fallback)
  const { data: allAssessments, isLoading: assessmentsListLoading } = useQuery({
    queryKey: ['assessments-list'],
    queryFn: () => assessmentsApi.list(),
    enabled: !assessmentId,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      journeysApi.saveClarification(journeyId!, assessmentId!, {
        virtue_relation_note: form.virtue_relation_note || undefined,
        lacuna_reduction_note: form.lacuna_reduction_note,
        unified_insight_note: form.unified_insight_note,
        personal_context_note: form.personal_context_note,
      }),
    onSuccess: () => {
      toast.success('Clarification saved')
      navigate(`/journeys/${journeyId}`)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (journeyLoading || assessmentLoading || assessmentsListLoading) return <PageLoader />

  if (!assessmentId) {
    const completedAssessments = allAssessments?.filter((a) => a.status === 'COMPLETED') ?? []
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <Link
          to={`/journeys/${journeyId}`}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to journey
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Articulate your understanding</h1>
          <p className="text-stone-500 mt-1 text-sm">Pick which assessment to clarify against</p>
        </div>
        {completedAssessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50 p-8 text-center">
            <FileText size={24} className="text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-600 mb-1">No completed assessments</p>
            <p className="text-xs text-stone-400">Complete an assessment first to clarify against it.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedAssessments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => navigate(`/journeys/${journeyId}/clarify/${a.id}`)}
                className="w-full text-left rounded-2xl border border-warm-200 bg-white p-4 hover:border-sage-300 hover:bg-sage-50 transition-colors"
              >
                <p className="text-sm font-semibold text-stone-800">{a.lacuna?.name_en}</p>
                {a.completed_at && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    Completed {new Date(a.completed_at).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const isValid =
    form.lacuna_reduction_note.trim() &&
    form.unified_insight_note.trim() &&
    form.personal_context_note.trim()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Back */}
      <Link
        to={`/journeys/${journeyId}`}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to journey
      </Link>

      {/* Header */}
      <div>
        <Badge variant="info">Clarification required</Badge>
        <h1 className="text-2xl font-bold text-stone-800 mt-2">Articulate your understanding</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Before you begin practice, reflect deeply on how this sentence connects to your inner work
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
        className="space-y-6"
      >
        <Card padding="md">
          <h2 className="text-sm font-semibold text-stone-800 mb-4">Required reflections</h2>
          <div className="space-y-5">
            <Textarea
              label="How does this sentence reduce your lacuna? *"
              value={form.lacuna_reduction_note}
              onChange={(e) => setForm({ ...form, lacuna_reduction_note: e.target.value })}
              placeholder="Explain the connection between practicing this sentence and reducing your identified weakness..."
              rows={4}
              required
              hint={assessment?.lacuna ? `Lacuna: ${assessment.lacuna.name_en}` : undefined}
            />
            <Textarea
              label="What personal incident or pattern does this address? *"
              value={form.personal_context_note}
              onChange={(e) => setForm({ ...form, personal_context_note: e.target.value })}
              placeholder="Describe a specific situation from your life that this sentence speaks to..."
              rows={4}
              required
              hint={journey?.sentence?.text_en ? `Sentence: "${journey.sentence.text_en}"` : undefined}
            />
            <Textarea
              label="Unified insight — how does it all connect? *"
              value={form.unified_insight_note}
              onChange={(e) => setForm({ ...form, unified_insight_note: e.target.value })}
              placeholder="Synthesize your understanding of how this sentence, the virtue, and your lacuna are interconnected..."
              rows={4}
              required
              hint={[
                journey?.sentence?.text_en ? `Sentence: "${journey.sentence.text_en}"` : null,
                assessment?.lacuna ? `Lacuna: ${assessment.lacuna.name_en}` : null,
              ].filter(Boolean).join(' · ') || undefined}
            />
            <Textarea
              label="How does this relate to the virtue? (optional)"
              value={form.virtue_relation_note}
              onChange={(e) => setForm({ ...form, virtue_relation_note: e.target.value })}
              placeholder="Describe how practicing this sentence cultivates the associated virtue..."
              rows={3}
              hint={journey?.sentence?.sub_virtue?.virtue?.name_en ? `Virtue: ${journey.sentence.sub_virtue.virtue.name_en}` : undefined}
            />
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid}
          loading={saveMutation.isPending}
        >
          Save clarification <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  )
}
