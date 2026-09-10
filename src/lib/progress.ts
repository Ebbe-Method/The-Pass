import type { ProgressEvent, Ticket } from '../kiosk/types'

export function isProgressEvent(event: ProgressEvent): boolean {
  if (event.bot && event.kind === 'comment') return false
  return (
    event.kind === 'commit' ||
    event.kind === 'review' ||
    event.kind === 'ci' ||
    event.kind === 'comment' ||
    event.kind === 'label'
  )
}

export function lastProgressAt(ticket: Ticket): string {
  const real = ticket.events.filter(isProgressEvent)
  if (real.length === 0) return ticket.openedAt
  return real.reduce((latest, event) => (event.at > latest ? event.at : latest), real[0].at)
}

export function lastProgressEvent(ticket: Ticket): ProgressEvent | undefined {
  const real = ticket.events.filter(isProgressEvent)
  if (real.length === 0) return undefined
  return real.reduce((latest, event) => (event.at > latest.at ? event : latest))
}
