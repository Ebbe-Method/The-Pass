import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

export function HeatClock({
  ms,
  label,
  hot = false,
}: {
  ms: number
  label: string
  hot?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-[0.18em] text-ink-soft uppercase">
        {label}
      </span>
      <span
        className={cn(
          'font-clock text-2xl leading-none tabular-nums',
          hot ? 'text-heat-hot' : 'text-ink',
        )}
      >
        {formatClock(ms)}
      </span>
    </div>
  )
}
