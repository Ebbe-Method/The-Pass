import { useState } from 'react'
import { ActorChip } from '@/components/ActorChip'
import { EmptyPass } from '@/components/EmptyPass'
import { HeatClock } from '@/components/HeatClock'
import { TicketCard } from '@/components/Ticket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { demoTickets } from '@/fixtures/tickets'
import { presentTicket } from '@/lib/present'

export function DesignPage() {
  const [now] = useState(() => Date.now())
  const sample = presentTicket(demoTickets[0], now)
  const cooking = presentTicket(
    demoTickets.find((t) => t.id === 'cursor-live') ?? demoTickets[2],
    now,
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="font-clock text-[11px] tracking-[0.28em] text-lamp uppercase">
        The Pass · living system
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Design</h1>
      <p className="mt-3 max-w-2xl text-paper/65">
        Quiet field. One heat lamp. Paper tickets. Status is a word plus a mark,
        never color alone. Heat pulse is a kitchen lamp on waiting or stale —
        not a decorative orb.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-xl">Tokens</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['field', 'bg-field'],
            ['paper', 'bg-paper'],
            ['heat', 'bg-heat'],
            ['lamp', 'bg-lamp'],
          ].map(([name, swatch]) => (
            <div key={name} className="overflow-hidden rounded-md border border-steel">
              <div className={`h-16 ${swatch}`} />
              <p className="px-3 py-2 font-clock text-xs uppercase">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl">Type</h2>
        <p className="mt-3 font-display text-3xl">Sora for titles on the pass.</p>
        <p className="font-clock mt-2 text-2xl tabular-nums">IBM Plex Mono 12m</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl">Ticket</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TicketCard row={sample} onOpen={() => undefined} />
          <TicketCard row={cooking} onOpen={() => undefined} />
        </div>
      </section>

      <section className="mt-12 flex flex-wrap items-center gap-4">
        <HeatClock ms={25 * 60 * 1000} label="quiet" hot />
        <ActorChip runtime="cursor" />
        <ActorChip runtime="claude" />
        <ActorChip runtime="unknown" />
        <Badge>waiting on you</Badge>
        <Button size="sm">Open GitHub</Button>
      </section>

      <section className="mt-12 rounded-md border border-steel p-4">
        <h2 className="font-display text-xl">Empty pass</h2>
        <EmptyPass />
      </section>

      <p className="mt-12 text-sm text-paper/45">
        Whitelisted motion: printer-tear entrance, heat pulse on waiting/stale.
        Sound stays off.
      </p>
    </div>
  )
}
