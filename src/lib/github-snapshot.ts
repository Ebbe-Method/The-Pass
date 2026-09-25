import type { Ticket } from '../kiosk/types'
import { sizeForTicket } from './labels.ts'
import { applyRuntimeOverlay } from './overlay.ts'

export type GithubLabelLike = { name: string } | string

export type GithubIssueLike = {
  id?: number
  number: number
  title?: string
  html_url?: string
  created_at?: string
  labels?: GithubLabelLike[]
  comments?: number
  pull_request?: unknown
  body?: string | null
  milestone?: { title?: string } | null
}

function labelName(label: GithubLabelLike): string {
  return typeof label === 'string' ? label : label.name
}

export function ticketFromGithubIssue(
  owner: string,
  repo: string,
  issue: GithubIssueLike,
): Ticket {
  const labels = (issue.labels ?? []).map(labelName)
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
    size: sizeForTicket({
      kind,
      labels,
      body: issue.body,
      milestone: issue.milestone,
    }),
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
