import type { BoardSnapshot, Ticket } from '../kiosk/types'
import type { CursorAgent } from './cursor-match'
import { classifyGithubEvent } from './github-events'
import type { IncomingGithubEvent } from './github-events'
import { sizeFromLabels } from './labels'
import { applyRuntimeOverlay } from './overlay'

const boards = new Map<string, BoardSnapshot>()

export function boardKey(owner: string, repo: string): string {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`
}

export function getBoard(owner: string, repo: string): BoardSnapshot | undefined {
  return boards.get(boardKey(owner, repo))
}

export function putBoard(snapshot: BoardSnapshot): BoardSnapshot {
  boards.set(boardKey(snapshot.owner, snapshot.repo), snapshot)
  return snapshot
}

function ticketFromPayload(
  owner: string,
  repo: string,
  payload: Record<string, unknown>,
): Ticket | null {
  const issue = (payload.issue ?? payload.pull_request) as
    | {
        id?: number
        number?: number
        title?: string
        html_url?: string
        created_at?: string
        labels?: { name: string }[]
        comments?: number
        pull_request?: unknown
        draft?: boolean
      }
    | undefined
  if (!issue?.number) return null
  const kind = payload.pull_request || issue.pull_request ? 'pr' : 'issue'
  const labels = (issue.labels ?? []).map((l) => l.name)
  return {
    id: String(issue.id ?? issue.number),
    number: issue.number,
    kind,
    title: issue.title ?? 'Untitled',
    url: issue.html_url ?? `https://github.com/${owner}/${repo}/issues/${issue.number}`,
    openedAt: issue.created_at ?? new Date().toISOString(),
    size: sizeFromLabels(labels),
    labels,
    events: [],
    ci: 'none',
    hasLinkedPr: Boolean(issue.pull_request) || kind === 'pr',
    commentCount: issue.comments ?? 0,
    runtime: 'unknown',
  }
}

function htmlFromPayload(payload: Record<string, unknown>): string | undefined {
  const comment = payload.comment as { body?: string } | undefined
  const issue = payload.issue as { body?: string } | undefined
  const pull = payload.pull_request as { body?: string } | undefined
  return comment?.body ?? issue?.body ?? pull?.body
}

export function applyGithubEvent(
  owner: string,
  repo: string,
  event: IncomingGithubEvent,
): BoardSnapshot {
  const key = boardKey(owner, repo)
  const existing =
    boards.get(key) ??
    ({
      owner,
      repo,
      tickets: [],
      generatedAt: new Date().toISOString(),
    } satisfies BoardSnapshot)

  const classified = classifyGithubEvent(event)
  const incoming = ticketFromPayload(owner, repo, event.payload)
  let tickets = [...existing.tickets]
  if (incoming) {
    const idx = tickets.findIndex((t) => t.number === incoming.number)
    const prior = idx >= 0 ? tickets[idx] : incoming
    let next: Ticket = {
      ...prior,
      title: incoming.title,
      labels: incoming.labels,
      size: incoming.size,
      commentCount: incoming.commentCount,
      hasLinkedPr: incoming.hasLinkedPr || prior.hasLinkedPr,
      events: [...prior.events],
    }
    next = applyRuntimeOverlay(next, { html: htmlFromPayload(event.payload) })
    if (classified) {
      next.events.push({
        kind: classified.kind,
        at: new Date().toISOString(),
        actor: classified.bot ? 'bot' : 'human',
        label: classified.label,
        bot: classified.bot,
      })
    }
    if (idx >= 0) tickets[idx] = next
    else tickets = [...tickets, next]
  }

  const snapshot: BoardSnapshot = {
    owner,
    repo,
    tickets,
    generatedAt: new Date().toISOString(),
  }
  boards.set(key, snapshot)
  return snapshot
}

export function applyInstallation(owner: string, repo: string): BoardSnapshot {
  const existing = getBoard(owner, repo)
  if (existing) return existing
  return putBoard({
    owner,
    repo,
    tickets: [],
    generatedAt: new Date().toISOString(),
  })
}

export function overlayBoardAgents(
  owner: string,
  repo: string,
  agents: CursorAgent[],
): BoardSnapshot | undefined {
  const existing = getBoard(owner, repo)
  if (!existing) return undefined
  const tickets = existing.tickets.map((ticket) =>
    applyRuntimeOverlay(ticket, { agents }),
  )
  return putBoard({
    ...existing,
    tickets,
    generatedAt: new Date().toISOString(),
  })
}
