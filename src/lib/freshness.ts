import type { Heat, Ticket, TicketState } from '../kiosk/types'
import { ABANDONED_MS, STALE_MS, WAITING_HOT_MS } from '../kiosk/types'
import { lastProgressAt } from './progress'

export function freshnessMs(ticket: Ticket, now: number): number {
  return Math.max(0, now - Date.parse(lastProgressAt(ticket)))
}

function isWaitingOnYou(ticket: Ticket): boolean {
  if (ticket.labels.includes('status:needs-rob')) return true
  return ticket.kind === 'pr' && ticket.ci === 'green'
}

function isCooking(ticket: Ticket): boolean {
  if (ticket.labels.includes('status:in-flight')) return true
  return ticket.kind === 'pr'
}

function isAbandonedClaim(ticket: Ticket, now: number): boolean {
  if (!ticket.labels.includes('status:in-flight')) return false
  if (ticket.commentCount > 0) return false
  if (ticket.hasLinkedPr) return false
  return freshnessMs(ticket, now) >= ABANDONED_MS
}

export function stateFor(ticket: Ticket, now: number): TicketState {
  if (isWaitingOnYou(ticket)) return 'waiting_on_you'
  if (isAbandonedClaim(ticket, now)) return 'stale'
  if (isCooking(ticket)) {
    if (freshnessMs(ticket, now) >= STALE_MS[ticket.size]) return 'stale'
    return 'cooking'
  }
  return 'queued'
}

export function heatFor(ticket: Ticket, now: number): Heat {
  const state = stateFor(ticket, now)
  if (state === 'stale') return 'hot'
  if (state === 'waiting_on_you') {
    return freshnessMs(ticket, now) >= WAITING_HOT_MS ? 'hot' : 'warm'
  }
  if (state === 'cooking') {
    const ratio = freshnessMs(ticket, now) / STALE_MS[ticket.size]
    if (ratio >= 0.5) return 'warm'
    return 'cool'
  }
  return 'cool'
}

export const STATE_LABEL: Record<TicketState, string> = {
  queued: 'queued',
  cooking: 'cooking',
  waiting_on_you: 'waiting on you',
  stale: 'stale',
}
