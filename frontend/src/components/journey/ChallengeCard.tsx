import { CheckCircle, XCircle, Trash2, Target } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { format } from 'date-fns'
import type { JourneyChallenge } from '../../types'

interface Props {
  challenge?: JourneyChallenge
  editable?: boolean
  onComplete?: () => void
  onAbandon?: () => void
  onDelete?: () => void
  onAdd?: () => void
  completing?: boolean
  abandoning?: boolean
  deleting?: boolean
}

const statusBadge: Record<string, 'success' | 'warning' | 'muted'> = {
  PLANNED:   'warning',
  COMPLETED: 'success',
  ABANDONED: 'muted',
}

export function ChallengeCard({
  challenge, editable, onComplete, onAbandon, onDelete, onAdd,
  completing, abandoning, deleting,
}: Props) {
  if (!challenge) {
    return (
      <div className="rounded-2xl border border-dashed border-warm-300 bg-warm-50 p-8 text-center">
        <Target size={24} className="text-stone-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-stone-600 mb-1">No challenge set</p>
        <p className="text-xs text-stone-400 mb-4">Add a challenge once you have practiced enough</p>
        {editable && onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Target size={13} /> Add challenge
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warm-200 bg-white shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-sage-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-stone-800">{challenge.title}</p>
        </div>
        <Badge variant={statusBadge[challenge.status] ?? 'muted'}>{challenge.status}</Badge>
      </div>

      {challenge.description && (
        <p className="text-sm text-stone-600 leading-relaxed">{challenge.description}</p>
      )}

      <div className="rounded-xl bg-warm-50 border border-warm-200 px-3 py-2.5">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Achievement criteria</p>
        <p className="text-sm text-stone-700 leading-relaxed">{challenge.achievement_criteria}</p>
      </div>

      {challenge.completed_at && (
        <p className="text-xs text-sage-600 font-medium">
          Completed on {format(new Date(challenge.completed_at), 'MMMM d, yyyy')}
        </p>
      )}

      {editable && challenge.status === 'PLANNED' && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={onComplete}
            loading={completing}
            className="flex-1"
          >
            <CheckCircle size={13} /> Mark completed
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onAbandon}
            loading={abandoning}
          >
            <XCircle size={13} /> Abandon
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            loading={deleting}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      )}

      {editable && challenge.status !== 'PLANNED' && onDelete && (
        <Button size="sm" variant="danger" onClick={onDelete} loading={deleting}>
          <Trash2 size={13} /> Delete
        </Button>
      )}
    </div>
  )
}
