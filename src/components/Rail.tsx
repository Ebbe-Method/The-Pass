import { EmptyPass } from '@/components/EmptyPass'
import { TicketCard } from '@/components/Ticket'
import type { LayoutId } from '@/kiosk/types'
import { layoutPass } from '@/lib/pass-layout'
import type { PresentedTicket } from '@/lib/present'
import { cn } from '@/lib/utils'

function groupByStation(rows: PresentedTicket[]) {
  const groups = new Map<string, PresentedTicket[]>()
  for (const row of rows) {
    const key = row.ticket.runtime ?? 'unknown'
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  return groups
}

export function Rail({
  rows,
  layout,
  onOpen,
}: {
  rows: PresentedTicket[]
  layout: LayoutId
  onOpen: (row: PresentedTicket) => void
}) {
  if (layout === 'pits') {
    const waiting = rows.filter(
      (r) => r.state === 'waiting_on_you' || r.state === 'stale',
    )
    const cooking = rows.filter(
      (r) => r.state === 'cooking' || r.state === 'queued',
    )
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Pit title="Waiting" hint="Needs a click" rows={waiting} onOpen={onOpen} />
        <Pit title="Cooking" hint="In motion" rows={cooking} onOpen={onOpen} />
      </div>
    )
  }

  if (layout === 'stations') {
    const groups = groupByStation(rows)
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...groups.entries()].map(([station, list]) => (
          <div key={station} className="min-w-[260px] flex-1">
            <h2 className="mb-3 font-clock text-[11px] tracking-[0.2em] text-paper/50 uppercase">
              {station}
            </h2>
            <div className="flex flex-col gap-3">
              {list.map((row) => (
                <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const pass = layoutPass(rows)
  if (
    pass.expo.length === 0 &&
    pass.line.length === 0 &&
    pass.wellCount === 0
  ) {
    return <EmptyPass />
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg">Expo</h2>
          <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
            Walk these
          </p>
        </header>
        {pass.expo.length === 0 ? (
          <p className="text-sm text-paper/50">Nothing under the lamp.</p>
        ) : (
          <div className="pass-expo">
            {pass.expo.map((row) => (
              <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg">Line</h2>
          <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
            On the fire
          </p>
        </header>
        {pass.line.length === 0 ? (
          <p className="text-sm text-paper/50">No tickets on the line.</p>
        ) : (
          <div className="pass-line">
            {pass.line.map((row) => (
              <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
      <p className="font-clock text-sm tracking-[0.08em] text-paper/45">
        {pass.wellCount} in the well
      </p>
    </div>
  )
}

function Pit({
  title,
  hint,
  rows,
  onOpen,
}: {
  title: string
  hint: string
  rows: PresentedTicket[]
  onOpen: (row: PresentedTicket) => void
}) {
  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
          {hint}
        </p>
      </header>
      <div className={cn('flex flex-col gap-3', rows.length === 0 && 'opacity-40')}>
        {rows.length === 0 ? (
          <p className="text-sm text-paper/50">None.</p>
        ) : (
          rows.map((row) => (
            <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
          ))
        )}
      </div>
    </section>
  )
}
