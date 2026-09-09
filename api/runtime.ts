import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cookieFromRequest } from '../src/lib/app-credentials.ts'
import { getOrRefreshBoard } from '../src/lib/board-refresh.ts'
import { overlayBoardAgents } from '../src/lib/board-store.ts'
import type { CursorAgent } from '../src/lib/cursor-match.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const body = (req.body ?? {}) as {
    owner?: string
    repo?: string
    agents?: CursorAgent[]
  }
  if (!body.owner || !body.repo) {
    res.status(400).json({ error: 'missing owner/repo' })
    return
  }
  await getOrRefreshBoard(body.owner, body.repo, {
    env: process.env as Record<string, string | undefined>,
    cookie: cookieFromRequest(req.headers.cookie),
  })
  const snapshot = overlayBoardAgents(body.owner, body.repo, body.agents ?? [])
  if (!snapshot) {
    res.status(404).json({ error: 'no snapshot yet' })
    return
  }
  res.status(200).json({
    ok: true,
    tickets: snapshot.tickets.map((ticket) => ({
      number: ticket.number,
      runtime: ticket.runtime,
      sessionUrl: ticket.sessionUrl ?? null,
    })),
  })
}
