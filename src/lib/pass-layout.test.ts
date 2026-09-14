import { describe, expect, it } from 'vitest'
import type { Ticket } from '../kiosk/types'
import { AGENT_COVER_CAP, HUMAN_COVER_CAP } from './covers'
import { layoutPass } from './pass-layout'
import { presentTicket } from './present'

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

const T0 = Date.parse('2026-09-09T12:10:00.000Z')

function row(partial: Partial<Ticket>): ReturnType<typeof presentTicket> {
  return presentTicket(ticket(partial), T0)
}

describe('layoutPass', () => {
  it('keeps waiting and stale on expo even when the human meter is slammed', () => {
    const rows = [
      row({
        id: 'a',
        number: 1,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
      row({
        id: 'b',
        number: 2,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
      row({
        id: 'stale',
        number: 3,
        size: 'M',
        openedAt: '2026-09-09T09:00:00.000Z',
        labels: ['status:in-flight'],
        commentCount: 0,
        hasLinkedPr: false,
      }),
    ]
    const pass = layoutPass(rows)
    expect(pass.expo.map((r) => r.ticket.id)).toEqual(['stale', 'a', 'b'])
    expect(pass.humanCovers).toBe(8 + 8 + 2)
    expect(pass.humanCap).toBe(HUMAN_COVER_CAP)
    expect(pass.humanSlammed).toBe(true)
    expect(pass.expo).toHaveLength(3)
  })

  it('paints cooking until 24 covers and counts overflow in the well and on the agent meter', () => {
    const cooking = Array.from({ length: 4 }, (_, i) =>
      row({
        id: `xl-${i}`,
        number: i + 10,
        size: 'XL',
        labels: ['status:in-flight'],
        commentCount: 2,
        hasLinkedPr: true,
      }),
    )
    const queued = row({
      id: 'q',
      number: 99,
      size: 'S',
      labels: [],
    })
    const pass = layoutPass([...cooking, queued])
    expect(pass.line).toHaveLength(3)
    expect(pass.line.every((r) => r.state === 'cooking')).toBe(true)
    expect(pass.wellCount).toBe(2)
    expect(pass.agentCovers).toBe(32)
    expect(pass.agentCap).toBe(AGENT_COVER_CAP)
    expect(pass.agentSlammed).toBe(true)
    expect(pass.line.find((r) => r.ticket.id === queued.ticket.id)).toBeUndefined()
    expect(pass.expo).toHaveLength(0)
  })

  it('skips a plate that does not fit and still fills with a later smaller one', () => {
    // Rank is hottest then closest-to-stale, not input order.
    // 10×M: remaining 10m (warm). XL: remaining 20m (warm). S: remaining 30m (cool).
    const cooking = (
      partial: Partial<Ticket> & { id: string; at: string },
    ) => {
      const { at, ...rest } = partial
      return row({
        labels: ['status:in-flight'],
        commentCount: 2,
        hasLinkedPr: true,
        events: [
          {
            kind: 'commit',
            at,
            actor: 'cursor',
            label: 'commit',
          },
        ],
        ...rest,
      })
    }
    const tens = Array.from({ length: 10 }, (_, i) =>
      cooking({
        id: `m-${i}`,
        number: i + 1,
        size: 'M',
        at: '2026-09-09T10:20:00.000Z',
      }),
    )
    const banquet = cooking({
      id: 'banquet',
      number: 50,
      size: 'XL',
      at: '2026-09-09T04:30:00.000Z',
    })
    const side = cooking({
      id: 'side',
      number: 51,
      size: 'S',
      at: '2026-09-09T11:55:00.000Z',
    })
    const pass = layoutPass([banquet, side, ...tens])
    expect(pass.line.map((r) => r.ticket.id)).toContain('side')
    expect(pass.line.map((r) => r.ticket.id)).not.toContain('banquet')
    expect(pass.wellCount).toBe(1)
    expect(pass.agentCovers).toBe(20 + 8 + 1)
    expect(pass.agentSlammed).toBe(true)
  })

  it('is not slammed at exactly the cap', () => {
    const pass = layoutPass([
      row({
        id: 'xl',
        number: 1,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
    ])
    expect(pass.humanCovers).toBe(8)
    expect(pass.humanSlammed).toBe(false)
  })
})
