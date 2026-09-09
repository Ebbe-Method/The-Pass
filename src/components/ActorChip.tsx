import type { ActorRuntime } from '@/kiosk/types'
import { cn } from '@/lib/utils'

const ACTOR: Record<
  ActorRuntime,
  { short: string; label: string; mark: string }
> = {
  cursor: { short: 'Cu', label: 'Cursor', mark: 'bg-lamp text-ink' },
  claude: { short: 'Cl', label: 'Claude', mark: 'bg-paper text-ink' },
  copilot: { short: 'Co', label: 'Copilot', mark: 'bg-cool text-field' },
  human: { short: 'You', label: 'You', mark: 'bg-heat text-field' },
  bot: { short: 'Bot', label: 'Bot', mark: 'bg-steel text-paper' },
  unknown: { short: '—', label: 'Unknown runtime', mark: 'border border-dashed border-steel bg-transparent text-ink-soft' },
}

export function ActorChip({
  runtime,
  compact = false,
}: {
  runtime: ActorRuntime
  compact?: boolean
}) {
  const actor = ACTOR[runtime]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-black/20 pr-2 pl-0.5',
        compact && 'pr-1.5',
      )}
      title={actor.label}
    >
      <span
        className={cn(
          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-clock text-[10px] font-medium',
          actor.mark,
        )}
        aria-hidden="true"
      >
        {actor.short.slice(0, 2)}
      </span>
      {!compact && (
        <span className="font-display text-[11px] tracking-wide opacity-80">
          {actor.label}
        </span>
      )}
      <span className="sr-only">{actor.label}</span>
    </span>
  )
}
