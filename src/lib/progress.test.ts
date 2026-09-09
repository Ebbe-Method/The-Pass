import { describe, expect, it } from 'vitest'
import type { ProgressEvent, Ticket } from '../kiosk/types'
import { isProgressEvent, lastProgressAt } from './progress'

const at = (iso: string): ProgressEvent => ({
  kind: 'comment',
  at: iso,
  actor: 'human',
  label: 'note',
})

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'Wire heartbeat',
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

describe('isProgressEvent', () => {
  it('counts a commit as progress', () => {
    expect(
      isProgressEvent({
        kind: 'commit',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'cursor',
        label: 'push',
      }),
    ).toBe(true)
  })

  it('counts a review submit as progress', () => {
    expect(
      isProgressEvent({
        kind: 'review',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'human',
        label: 'approved',
      }),
    ).toBe(true)
  })

  it('counts a CI conclusion as progress', () => {
    expect(
      isProgressEvent({
        kind: 'ci',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'bot',
        label: 'checks concluded',
      }),
    ).toBe(true)
  })

  it('counts a non-bot comment as progress', () => {
    expect(
      isProgressEvent({
        kind: 'comment',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'human',
        label: 'left a note',
      }),
    ).toBe(true)
  })

  it('counts a status-label change as progress', () => {
    expect(
      isProgressEvent({
        kind: 'label',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'human',
        label: 'status:in-flight',
      }),
    ).toBe(true)
  })

  it('does not count a bot lint comment', () => {
    expect(
      isProgressEvent({
        kind: 'comment',
        at: '2026-09-09T13:00:00.000Z',
        actor: 'bot',
        label: 'lint',
        bot: true,
      }),
    ).toBe(false)
  })
})

describe('lastProgressAt', () => {
  it('falls back to openedAt when no progress events exist', () => {
    const t = ticket({ events: [] })
    expect(lastProgressAt(t)).toBe(t.openedAt)
  })

  it('ignores bot lint comments when finding last progress', () => {
    const t = ticket({
      openedAt: '2026-09-09T12:00:00.000Z',
      events: [
        {
          kind: 'comment',
          at: '2026-09-09T14:00:00.000Z',
          actor: 'bot',
          label: 'lint',
          bot: true,
        },
        at('2026-09-09T13:00:00.000Z'),
      ],
    })
    expect(lastProgressAt(t)).toBe('2026-09-09T13:00:00.000Z')
  })
})
