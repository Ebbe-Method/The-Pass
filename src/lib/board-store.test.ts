import { describe, expect, it } from 'vitest'
import { applyGithubEvent, getBoard } from './board-store'

describe('applyGithubEvent', () => {
  it('opens a ticket from an issues webhook and records a label', () => {
    const snapshot = applyGithubEvent('acme', 'widgets', {
      name: 'issues',
      payload: {
        action: 'labeled',
        issue: {
          id: 9,
          number: 44,
          title: 'Heat the pass',
          html_url: 'https://github.com/acme/widgets/issues/44',
          created_at: '2026-09-09T12:00:00.000Z',
          labels: [{ name: 'status:in-flight' }],
          comments: 0,
        },
        label: { name: 'status:in-flight' },
      },
    })
    expect(snapshot.tickets).toHaveLength(1)
    expect(snapshot.tickets[0].number).toBe(44)
    expect(snapshot.tickets[0].events[0]?.kind).toBe('label')
    expect(getBoard('acme', 'widgets')?.tickets[0].title).toBe('Heat the pass')
  })

  it('applies a kitchen claim comment as the runtime overlay', () => {
    applyGithubEvent('acme', 'claim-lab', {
      name: 'issues',
      payload: {
        action: 'opened',
        issue: {
          id: 10,
          number: 90,
          title: 'Claim this',
          html_url: 'https://github.com/acme/claim-lab/issues/90',
          created_at: '2026-09-09T12:00:00.000Z',
          labels: [{ name: 'size:S' }],
          comments: 0,
        },
      },
    })
    const snapshot = applyGithubEvent('acme', 'claim-lab', {
      name: 'issue_comment',
      payload: {
        action: 'created',
        issue: {
          id: 10,
          number: 90,
          title: 'Claim this',
          html_url: 'https://github.com/acme/claim-lab/issues/90',
          labels: [{ name: 'size:S' }],
          comments: 1,
        },
        comment: {
          body: '<!-- kitchen:claim runtime="claude" -->',
          user: { type: 'User' },
        },
      },
    })
    expect(snapshot.tickets).toHaveLength(1)
    expect(snapshot.tickets[0].runtime).toBe('claude')
    expect(snapshot.tickets[0].size).toBe('S')
  })
})
