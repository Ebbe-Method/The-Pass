import type { PresentedTicket } from './present.ts'
import { HEAT_RANK } from './present.ts'
import {
  AGENT_COVER_CAP,
  HUMAN_COVER_CAP,
  coversFor,
} from './covers.ts'

export type PassLayout = {
  expo: PresentedTicket[]
  line: PresentedTicket[]
  wellCount: number
  humanCovers: number
  agentCovers: number
  humanCap: number
  agentCap: number
  humanSlammed: boolean
  agentSlammed: boolean
}

function isExpo(row: PresentedTicket): boolean {
  return row.state === 'waiting_on_you' || row.state === 'stale'
}

function byLamp(a: PresentedTicket, b: PresentedTicket): number {
  const heat = HEAT_RANK[a.heat] - HEAT_RANK[b.heat]
  if (heat !== 0) return heat
  const remain = a.remainingMs - b.remainingMs
  if (remain !== 0) return remain
  return a.ticket.number - b.ticket.number
}

export function layoutPass(rows: PresentedTicket[]): PassLayout {
  const expo = rows.filter(isExpo).sort(byLamp)
  const cooking = rows.filter((row) => row.state === 'cooking').sort(byLamp)
  const queued = rows.filter((row) => row.state === 'queued')

  const line: PresentedTicket[] = []
  let used = 0
  const overflow: PresentedTicket[] = []
  for (const row of cooking) {
    const cost = coversFor(row.ticket.size)
    if (used + cost <= AGENT_COVER_CAP) {
      line.push(row)
      used += cost
    } else {
      overflow.push(row)
    }
  }

  const humanCovers = expo.reduce(
    (sum, row) => sum + coversFor(row.ticket.size),
    0,
  )
  const agentCovers = cooking.reduce(
    (sum, row) => sum + coversFor(row.ticket.size),
    0,
  )

  return {
    expo,
    line,
    wellCount: queued.length + overflow.length,
    humanCovers,
    agentCovers,
    humanCap: HUMAN_COVER_CAP,
    agentCap: AGENT_COVER_CAP,
    humanSlammed: humanCovers > HUMAN_COVER_CAP,
    agentSlammed: agentCovers > AGENT_COVER_CAP,
  }
}
