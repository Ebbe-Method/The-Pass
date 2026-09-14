import { cn } from '@/lib/utils'

export function CoverMeter({
  label,
  used,
  cap,
  slammed,
}: {
  label: string
  used: number
  cap: number
  slammed: boolean
}) {
  return (
    <div className="text-right">
      <p
        className={cn(
          'font-clock text-3xl tabular-nums',
          slammed ? 'text-heat' : 'text-paper',
        )}
      >
        {used} / {cap}
      </p>
      <p className="text-[11px] tracking-[0.18em] text-paper/45 uppercase">
        {label}
        {slammed ? ' · slammed' : ''}
      </p>
    </div>
  )
}
