import { describe, expect, it } from 'vitest'
import type { Ticket } from '../kiosk/types'
import { applyRuntimeOverlay } from './overlay'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 3840,
    kind: 'issue',
    title: 'Kitchen claim heartbeat',
    url: 'https://github.com/example/repo/issues/3840',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'S',
    labels: ['status:in-flight'],
    events: [],
    ci: 'none',
    hasLinkedPr: false,
    commentCount: 0,
    runtime: 'unknown',
    ...partial,
  }
}

describe('applyRuntimeOverlay', () => {
  it('uses the heartbeat comment when present', () => {
    const html =
      '<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-abc" -->'
    const next = applyRuntimeOverlay(ticket(), { html })
    expect(next.runtime).toBe('cursor')
    expect(next.sessionUrl).toBe('https://cursor.com/agents/bc-abc')
  })

  it('matches a Cursor Cloud agent by isolated issue number', () => {
    const next = applyRuntimeOverlay(ticket({ number: 3840 }), {
      agents: [
        {
          bcId: 'bc-live',
          branchName: 'cursor/kitchen-claim-3840',
          name: 'Heartbeat',
          status: 'RUNNING',
        },
      ],
    })
    expect(next.runtime).toBe('cursor')
    expect(next.sessionUrl).toBe('https://cursor.com/agents/bc-live')
  })

  it('does not treat 384 as a match for branch 3840', () => {
    const next = applyRuntimeOverlay(ticket({ number: 384 }), {
      agents: [
        {
          bcId: 'bc-wrong',
          branchName: 'cursor/kitchen-claim-3840',
          name: 'Heartbeat',
          status: 'RUNNING',
        },
      ],
    })
    expect(next.runtime).toBe('unknown')
    expect(next.sessionUrl).toBeUndefined()
  })

  it('leaves an honest empty chip when overlay is missing', () => {
    const next = applyRuntimeOverlay(ticket({ runtime: 'unknown' }), {})
    expect(next.runtime).toBe('unknown')
    expect(next.sessionUrl).toBeUndefined()
  })
})
