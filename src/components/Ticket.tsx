import { ActorChip } from '@/components/ActorChip'
import { HeatClock } from '@/components/HeatClock'
import { STATE_LABEL } from '@/lib/freshness'
import type { PresentedTicket } from '@/lib/present'
import { lastProgressEvent } from '@/lib/progress'
import { cn } from '@/lib/utils'

function tiltFor(id: string): string {
  let n = 0
  for (const ch of id) n = (n + ch.charCodeAt(0)) % 11
  return `${(n - 5) * 0.18}deg`
}

const STATE_MARK: Record<string, string> = {
  queued: '○ queued',
  cooking: '◌ cooking',
  waiting_on_you: '● waiting on you',
  stale: '▲ stale',
}

export function TicketCard({
  row,
  onOpen,
}: {
  row: PresentedTicket
  onOpen: (row: PresentedTicket) => void
}) {
  const { ticket, state, heat, waitMs, freshMs, actors } = row
  const last = lastProgressEvent(ticket)
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      style={{ ['--tilt' as string]: tiltFor(ticket.id) }}
      data-heat={heat}
      className={cn(
        'ticket relative flex w-full flex-col gap-4 rounded-sm bg-paper p-4 text-left text-ink',
        heat === 'hot' && 'ring-2 ring-heat',
        heat === 'warm' && 'ring-1 ring-lamp/80',
      )}
    >
      <div className="ticket-perforation absolute inset-x-0 top-0 h-3 opacity-80" />
      <div className="mt-2 flex items-start justify-between gap-3">
        <p
          className="font-display text-[15px] leading-snug font-semibold tracking-tight line-clamp-2"
          title={ticket.title}
        >
          <span className="mr-2 font-clock text-xs font-normal text-ink-soft">
            #{ticket.number}
          </span>
          {ticket.title}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-clock text-[10px] tracking-[0.12em] uppercase',
            heat === 'hot'
              ? 'bg-heat text-field'
              : heat === 'warm'
                ? 'bg-lamp/30 text-ink'
                : 'bg-black/5 text-ink-soft',
          )}
        >
          {STATE_MARK[state] ?? STATE_LABEL[state]}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <HeatClock ms={waitMs} label="open" />
        <HeatClock ms={freshMs} label="quiet" hot={heat === 'hot'} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {actors.length === 0 || actors.every((a) => a === 'unknown') ? (
          <ActorChip runtime="unknown" />
        ) : (
          actors
            .filter((a) => a !== 'unknown')
            .map((runtime) => (
              <ActorChip key={runtime} runtime={runtime} compact />
            ))
        )}
        {last && (
          <span className="ml-auto font-clock text-[10px] tracking-wide text-ink-soft uppercase">
            {last.label}
          </span>
        )}
      </div>
    </button>
  )
}
