import { describe, expect, it } from 'vitest'
import { ticketFromGithubIssue } from './github-snapshot'

describe('ticketFromGithubIssue', () => {
  it('maps an issue, size label, and kitchen claim in the body', () => {
    const ticket = ticketFromGithubIssue('acme', 'widgets', {
      id: 99,
      number: 12,
      title: 'Unstick stale tickets',
      html_url: 'https://github.com/acme/widgets/issues/12',
      created_at: '2026-09-09T12:00:00.000Z',
      labels: [{ name: 'size:S' }, { name: 'status:in-flight' }],
      comments: 2,
      body: '<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-abc" -->',
    })
    expect(ticket.kind).toBe('issue')
    expect(ticket.size).toBe('S')
    expect(ticket.runtime).toBe('cursor')
    expect(ticket.sessionUrl).toBe('https://cursor.com/agents/bc-abc')
    expect(ticket.hasLinkedPr).toBe(false)
  })

  it('accepts labels as plain strings', () => {
    const ticket = ticketFromGithubIssue('acme', 'widgets', {
      number: 14,
      title: 'String labels',
      labels: ['size:XL', 'status:in-flight'],
    })
    expect(ticket.size).toBe('XL')
    expect(ticket.labels).toContain('status:in-flight')
  })

  it('maps a pull request as a PR ticket', () => {
    const ticket = ticketFromGithubIssue('acme', 'widgets', {
      id: 100,
      number: 13,
      title: 'Add heat pulse',
      html_url: 'https://github.com/acme/widgets/pull/13',
      created_at: '2026-09-09T12:00:00.000Z',
      labels: [{ name: 'size:L' }],
      comments: 0,
      pull_request: { url: 'https://api.github.com/repos/acme/widgets/pulls/13' },
    })
    expect(ticket.kind).toBe('pr')
    expect(ticket.hasLinkedPr).toBe(true)
    expect(ticket.size).toBe('L')
    expect(ticket.runtime).toBe('unknown')
  })

  it('infers S for an unlabeled short PR', () => {
    const ticket = ticketFromGithubIssue('acme', 'widgets', {
      number: 20,
      title: 'Typo',
      html_url: 'https://github.com/acme/widgets/pull/20',
      labels: [],
      pull_request: { url: 'https://api.github.com/repos/acme/widgets/pulls/20' },
      body: 'fix typo',
    })
    expect(ticket.size).toBe('S')
  })

  it('infers XL from epic or milestone when unlabeled', () => {
    const epic = ticketFromGithubIssue('acme', 'widgets', {
      number: 21,
      title: 'Platform rewrite',
      labels: ['epic'],
      body: 'hi',
    })
    expect(epic.size).toBe('XL')
    const milestoned = ticketFromGithubIssue('acme', 'widgets', {
      number: 22,
      title: 'Launch work',
      labels: [],
      body: 'hi',
      milestone: { title: 'v2' },
    })
    expect(milestoned.size).toBe('XL')
  })
})
