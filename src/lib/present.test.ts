import { describe, expect, it } from 'vitest'
import type { Ticket } from '../kiosk/types'
import { sortPresented, visibleTickets, presentTicket } from './present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'x',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'M',
    labels: [],
    events: [],
    ci: 'none',
    hasLinkedPr: false,
    commentCount: 0,
    ...partial,
  }
}

describe('visibleTickets', () => {
  it('holds magic-moment tickets until their arrive time', () => {
    const late = ticket({ id: 'late', arriveAfterMs: 8000 })
    const now = ticket({ id: 'now' })
    expect(visibleTickets([late, now], 1000).map((t) => t.id)).toEqual(['now'])
    expect(visibleTickets([late, now], 8000).map((t) => t.id)).toEqual([
      'late',
      'now',
    ])
  })
})

describe('sortPresented', () => {
  it('puts hot waiting tickets ahead of cool queued ones', () => {
    const now = Date.parse('2026-09-09T14:00:00.000Z')
    const queued = presentTicket(ticket({ id: 'q', labels: [] }), now)
    const waiting = presentTicket(
      ticket({
        id: 'w',
        labels: ['status:needs-rob'],
        openedAt: '2026-09-09T13:00:00.000Z',
      }),
      now,
    )
    expect(sortPresented([queued, waiting]).map((r) => r.ticket.id)).toEqual([
      'w',
      'q',
    ])
  })

  it('exposes remaining time until the size goes stale', () => {
    const now = Date.parse('2026-09-09T12:15:00.000Z')
    const row = presentTicket(
      ticket({
        size: 'S',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    expect(row.remainingMs).toBe(30 * 60 * 1000)
  })

  it('orders the same heat by closest to stale', () => {
    const now = Date.parse('2026-09-09T12:20:00.000Z')
    const later = presentTicket(
      ticket({
        id: 'later',
        number: 2,
        size: 'L',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    const sooner = presentTicket(
      ticket({
        id: 'sooner',
        number: 3,
        size: 'S',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    expect(sortPresented([later, sooner]).map((r) => r.ticket.id)).toEqual([
      'sooner',
      'later',
    ])
  })
})
