import type { Ticket } from '../kiosk/types'
import { sizeFromLabels } from './labels'
import { applyRuntimeOverlay } from './overlay'

export type GithubIssueLike = {
  id?: number
  number: number
  title?: string
  html_url?: string
  created_at?: string
  labels?: { name: string }[]
  comments?: number
  pull_request?: unknown
  body?: string | null
}

export function ticketFromGithubIssue(
  owner: string,
  repo: string,
  issue: GithubIssueLike,
): Ticket {
  const labels = (issue.labels ?? []).map((label) => label.name)
  const kind = issue.pull_request ? 'pr' : 'issue'
  const ticket: Ticket = {
    id: String(issue.id ?? issue.number),
    number: issue.number,
    kind,
    title: issue.title ?? 'Untitled',
    url:
      issue.html_url ??
      `https://github.com/${owner}/${repo}/${kind === 'pr' ? 'pull' : 'issues'}/${issue.number}`,
    openedAt: issue.created_at ?? new Date().toISOString(),
    size: sizeFromLabels(labels),
    labels,
    events: [],
    ci: 'none',
    hasLinkedPr: Boolean(issue.pull_request) || kind === 'pr',
    commentCount: issue.comments ?? 0,
    runtime: 'unknown',
  }
  return applyRuntimeOverlay(ticket, { html: issue.body ?? undefined })
}

export function snapshotTicketsFromGithubIssues(
  owner: string,
  repo: string,
  issues: GithubIssueLike[],
): Ticket[] {
  return issues.map((issue) => ticketFromGithubIssue(owner, repo, issue))
}
