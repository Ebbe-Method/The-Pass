export type TicketKind = 'issue' | 'pr'
export type TicketState = 'queued' | 'cooking' | 'waiting_on_you' | 'stale'
export type ActorRuntime =
  | 'cursor'
  | 'claude'
  | 'copilot'
  | 'human'
  | 'bot'
  | 'unknown'
export type Size = 'S' | 'M' | 'L' | 'XL'
export type ProgressKind = 'commit' | 'review' | 'ci' | 'comment' | 'label'
export type CiState = 'pending' | 'green' | 'red' | 'none'
export type LayoutId = 'expo' | 'pits' | 'stations'
export type Distance = '2ft' | '10ft'
export type Heat = 'cool' | 'warm' | 'hot'

export type ProgressEvent = {
  kind: ProgressKind
  at: string
  actor: ActorRuntime
  label: string
  bot?: boolean
}

export type Ticket = {
  id: string
  number: number
  kind: TicketKind
  title: string
  url: string
  openedAt: string
  size: Size
  labels: string[]
  events: ProgressEvent[]
  sessionUrl?: string
  runtime?: ActorRuntime
  ci: CiState
  hasLinkedPr: boolean
  commentCount: number
  /** Demo-only: ms after kiosk mount before this ticket tears onto the rail. */
  arriveAfterMs?: number
}

export type BoardSnapshot = {
  owner: string
  repo: string
  tickets: Ticket[]
  generatedAt: string
}

export const STALE_MS: Record<Size, number> = {
  S: 45 * 60 * 1000,
  M: 2 * 60 * 60 * 1000,
  L: 4 * 60 * 60 * 1000,
  XL: 8 * 60 * 60 * 1000,
}

export const WAITING_HOT_MS = 20 * 60 * 1000
export const ABANDONED_MS = 2 * 60 * 60 * 1000
