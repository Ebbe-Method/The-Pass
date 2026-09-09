import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBoard } from '../src/lib/board-store'
import { stateFor } from '../src/lib/freshness'
import { boardOgSvg } from '../src/lib/og-svg'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://local')
  const owner = url.searchParams.get('owner') ?? 'demo'
  const repo = url.searchParams.get('repo') ?? 'kitchen'
  const blur = url.searchParams.get('blur') === '1'
  const board = getBoard(owner, repo)
  const now = Date.now()
  const tickets = (board?.tickets ?? []).map((ticket) => ({
    number: ticket.number,
    title: ticket.title,
    state: stateFor(ticket, now),
  }))
  const svg = boardOgSvg({
    owner,
    repo,
    blur,
    tickets:
      tickets.length > 0
        ? tickets
        : [
            { number: 3064, title: 'Merge-queue attestation', state: 'waiting_on_you' },
            { number: 1321, title: 'Abandoned claim', state: 'stale' },
          ],
  })
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'no-cache')
  res.status(200).send(svg)
}
