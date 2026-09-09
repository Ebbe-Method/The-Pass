import type { ActorRuntime, Heat, Ticket, TicketState } from '../kiosk/types'
import { freshnessMs, heatFor, stateFor } from './freshness.ts'

export type PresentedTicket = {
  ticket: Ticket
  state: TicketState
  heat: Heat
  waitMs: number
  freshMs: number
  actors: ActorRuntime[]
}

const HEAT_RANK: Record<Heat, number> = { hot: 0, warm: 1, cool: 2 }

export function actorsOn(ticket: Ticket): ActorRuntime[] {
  const seen = new Set<ActorRuntime>()
  if (ticket.runtime) seen.add(ticket.runtime)
  for (const event of ticket.events) {
    if (event.actor !== 'unknown') seen.add(event.actor)
  }
  return [...seen]
}

export function presentTicket(ticket: Ticket, now: number): PresentedTicket {
  return {
    ticket,
    state: stateFor(ticket, now),
    heat: heatFor(ticket, now),
    waitMs: Math.max(0, now - Date.parse(ticket.openedAt)),
    freshMs: freshnessMs(ticket, now),
    actors: actorsOn(ticket),
  }
}

export function visibleTickets(tickets: Ticket[], elapsedMs: number): Ticket[] {
  return tickets.filter(
    (ticket) =>
      ticket.arriveAfterMs == null || elapsedMs >= ticket.arriveAfterMs,
  )
}

export function sortPresented(rows: PresentedTicket[]): PresentedTicket[] {
  return [...rows].sort((a, b) => {
    const heat = HEAT_RANK[a.heat] - HEAT_RANK[b.heat]
    if (heat !== 0) return heat
    return b.freshMs - a.freshMs
  })
}
