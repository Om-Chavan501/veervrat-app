import { Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { cn } from '../ui'
import type { JourneyExposure, JourneyResolution, ExposureStatus, ResolutionStatus } from '../../types'

// ─── Exposure list ──────────────────────────────────────────────────────────

const EXPOSURE_STATUS_CYCLE: ExposureStatus[] = ['PLANNED', 'TAKEN', 'SKIPPED']

const exposureStatusStyle: Record<ExposureStatus, string> = {
  PLANNED: 'bg-warm-100 text-stone-600 border-warm-200',
  TAKEN:   'bg-sage-100 text-sage-700 border-sage-200',
  SKIPPED: 'bg-stone-100 text-stone-500 border-stone-200',
}

interface ExposureListProps {
  items: JourneyExposure[]
  editable?: boolean
  onStatusChange?: (id: string, status: ExposureStatus) => void
  onDelete?: (id: string) => void
}

export function ExposureList({ items, editable, onStatusChange, onDelete }: ExposureListProps) {
  function nextStatus(current: ExposureStatus): ExposureStatus {
    const idx = EXPOSURE_STATUS_CYCLE.indexOf(current)
    return EXPOSURE_STATUS_CYCLE[(idx + 1) % EXPOSURE_STATUS_CYCLE.length]
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white px-3.5 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 leading-snug">{item.title}</p>
            {item.description && (
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.description}</p>
            )}
            <button
              key={item.status}
              type="button"
              disabled={!editable}
              onClick={() => editable && onStatusChange?.(item.id, nextStatus(item.status))}
              className={cn(
                'mt-1.5 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border transition-all animate-status-pop',
                exposureStatusStyle[item.status],
                editable && 'cursor-pointer hover:opacity-80',
                !editable && 'cursor-default',
              )}
            >
              {item.status}
            </button>
          </div>
          {editable && onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Resolution list ─────────────────────────────────────────────────────────

const RESOLUTION_STATUS_CYCLE: ResolutionStatus[] = ['ACTIVE', 'PAUSED', 'DONE']

const resolutionStatusStyle: Record<ResolutionStatus, string> = {
  ACTIVE: 'bg-sage-100 text-sage-700 border-sage-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  DONE:   'bg-stone-100 text-stone-500 border-stone-200',
}

interface ResolutionListProps {
  items: JourneyResolution[]
  editable?: boolean
  onStatusChange?: (id: string, status: ResolutionStatus) => void
  onDelete?: (id: string) => void
}

export function ResolutionList({ items, editable, onStatusChange, onDelete }: ResolutionListProps) {
  function nextStatus(current: ResolutionStatus): ResolutionStatus {
    const idx = RESOLUTION_STATUS_CYCLE.indexOf(current)
    return RESOLUTION_STATUS_CYCLE[(idx + 1) % RESOLUTION_STATUS_CYCLE.length]
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-warm-200 bg-white px-3.5 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 leading-snug">{item.title}</p>
            {item.description && (
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="muted">{item.frequency}</Badge>
              <button
                key={item.status}
                type="button"
                disabled={!editable}
                onClick={() => editable && onStatusChange?.(item.id, nextStatus(item.status))}
                className={cn(
                  'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border transition-all animate-status-pop',
                  resolutionStatusStyle[item.status],
                  editable && 'cursor-pointer hover:opacity-80',
                  !editable && 'cursor-default',
                )}
              >
                {item.status}
              </button>
            </div>
          </div>
          {editable && onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
