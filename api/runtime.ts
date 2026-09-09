import type { VercelRequest, VercelResponse } from '@vercel/node'
import { overlayBoardAgents } from '../src/lib/board-store'
import type { CursorAgent } from '../src/lib/cursor-match'

export default function handler(req: VercelRequest, res: VercelResponse) {
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
