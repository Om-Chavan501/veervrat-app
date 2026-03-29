import { CheckCircle, Lock } from 'lucide-react'
import { cn } from '../ui'

export type JourneyPhase = 'setup' | 'practice' | 'challenge'

interface PhaseItem {
  key: JourneyPhase
  label: string
  desc: string
}

const PHASES: PhaseItem[] = [
  { key: 'setup',     label: 'Setup',     desc: 'Vratmitra, exposures & resolutions' },
  { key: 'practice',  label: 'Practice',  desc: 'Practice and reflect' },
  { key: 'challenge', label: 'Challenge', desc: 'Final challenge' },
]

interface Props {
  current: JourneyPhase
  completed: Set<JourneyPhase>
  onSelect: (phase: JourneyPhase) => void
}

export function JourneyPhaseBar({ current, completed, onSelect }: Props) {
  return (
    <div className="flex gap-0 overflow-x-auto no-scrollbar">
      {PHASES.map((phase, idx) => {
        const isDone = completed.has(phase.key)
        const isActive = phase.key === current
        const isLocked = !isDone && !isActive && idx > PHASES.findIndex((p) => p.key === current)

        return (
          <button
            key={phase.key}
            onClick={() => !isLocked && onSelect(phase.key)}
            disabled={isLocked}
            className={cn(
              'flex-1 min-w-0 flex flex-col items-center gap-0.5 px-3 py-2.5 text-center transition-all relative',
              isActive && 'bg-white border-b-2 border-sage-500 shadow-sm',
              !isActive && !isLocked && 'hover:bg-warm-50',
              isLocked && 'opacity-40 cursor-not-allowed',
            )}
          >
            <div className="flex items-center gap-1.5">
              {isDone && !isActive ? (
                <CheckCircle size={12} className="text-sage-500 flex-shrink-0" />
              ) : isLocked ? (
                <Lock size={12} className="text-stone-400 flex-shrink-0" />
              ) : null}
              <span
                className={cn(
                  'text-sm font-semibold whitespace-nowrap',
                  isActive ? 'text-stone-900' : isDone ? 'text-sage-700' : 'text-stone-500',
                )}
              >
                {phase.label}
              </span>
            </div>
            <span className="text-xs text-stone-400 hidden sm:block truncate max-w-full">
              {phase.desc}
            </span>
          </button>
        )
      })}
    </div>
  )
}
