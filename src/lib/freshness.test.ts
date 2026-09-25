import { describe, expect, it } from 'vitest'
import type { Ticket } from '../kiosk/types'
import { ABANDONED_MS, STALE_MS, WAITING_HOT_MS } from '../kiosk/types'
import { freshnessMs, heatFor, remainingToStaleMs, stateFor } from './freshness'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'Claim the pass',
    url: 'https://github.com/example/repo/issues/1',
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

const T0 = Date.parse('2026-09-09T12:00:00.000Z')

describe('freshnessMs', () => {
  it('is elapsed time since last real progress', () => {
    const t = ticket({
      events: [
        {
          kind: 'commit',
          at: '2026-09-09T12:30:00.000Z',
          actor: 'cursor',
          label: 'push',
        },
      ],
    })
    expect(freshnessMs(t, T0 + 90 * 60 * 1000)).toBe(60 * 60 * 1000)
  })
})

describe('stateFor', () => {
  it('maps ready-for-agent and unlabeled open issues to queued', () => {
    expect(stateFor(ticket({ labels: [] }), T0)).toBe('queued')
    expect(stateFor(ticket({ labels: ['ready-for-agent'] }), T0)).toBe('queued')
  })

  it('maps in-flight or an open PR to cooking while fresh', () => {
    const now = T0 + 10 * 60 * 1000
    expect(
      stateFor(ticket({ labels: ['status:in-flight'] }), now),
    ).toBe('cooking')
    expect(
      stateFor(
        ticket({
          kind: 'pr',
          labels: [],
          ci: 'pending',
        }),
        now,
      ),
    ).toBe('cooking')
  })

  it('maps needs-rob or a green unarmed PR to waiting_on_you', () => {
    expect(
      stateFor(ticket({ labels: ['status:needs-rob'] }), T0 + 5 * 60 * 1000),
    ).toBe('waiting_on_you')
    expect(
      stateFor(
        ticket({
          kind: 'pr',
          ci: 'green',
          labels: [],
        }),
        T0 + 5 * 60 * 1000,
      ),
    ).toBe('waiting_on_you')
  })

  it('marks an in-flight issue with zero comments and no PR stale after 2h', () => {
    const t = ticket({
      labels: ['status:in-flight'],
      commentCount: 0,
      hasLinkedPr: false,
      events: [],
    })
    expect(stateFor(t, T0 + ABANDONED_MS)).toBe('stale')
    expect(stateFor(t, T0 + ABANDONED_MS - 1)).toBe('cooking')
  })

  it('uses size-aware stale while cooking', () => {
    const cooking = ticket({
      size: 'S',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(stateFor(cooking, T0 + STALE_MS.S)).toBe('stale')
    const large = ticket({
      size: 'XL',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(stateFor(large, T0 + STALE_MS.S)).toBe('cooking')
  })
})

describe('heatFor', () => {
  it('keeps queued and fresh cooking cool', () => {
    expect(heatFor(ticket({ labels: [] }), T0 + 60_000)).toBe('cool')
  })

  it('heats waiting_on_you after 20 minutes', () => {
    const t = ticket({ labels: ['status:needs-rob'] })
    expect(heatFor(t, T0 + WAITING_HOT_MS - 1)).toBe('warm')
    expect(heatFor(t, T0 + WAITING_HOT_MS)).toBe('hot')
  })

  it('marks stale tickets hot', () => {
    const t = ticket({
      labels: ['status:in-flight'],
      commentCount: 0,
      hasLinkedPr: false,
    })
    expect(heatFor(t, T0 + ABANDONED_MS)).toBe('hot')
  })
})

describe('remainingToStaleMs', () => {
  it('counts down the size budget from last progress', () => {
    const t = ticket({
      size: 'S',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(remainingToStaleMs(t, T0 + 15 * 60 * 1000)).toBe(30 * 60 * 1000)
    expect(remainingToStaleMs(t, T0 + STALE_MS.S)).toBe(0)
    expect(remainingToStaleMs(t, T0 + STALE_MS.S + 60_000)).toBe(0)
  })

  it('uses the XL budget when the plate is XL', () => {
    const t = ticket({
      size: 'XL',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(remainingToStaleMs(t, T0 + STALE_MS.S)).toBe(STALE_MS.XL - STALE_MS.S)
  })
})
