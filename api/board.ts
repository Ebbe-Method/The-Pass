import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cookieFromRequest } from '../src/lib/app-credentials'
import { getOrRefreshBoard } from '../src/lib/board-refresh'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const owner = String(req.query.owner ?? '')
  const repo = String(req.query.repo ?? '')
  if (!owner || !repo) {
    res.status(400).json({ error: 'missing owner/repo' })
    return
  }
  const board = await getOrRefreshBoard(owner, repo, {
    env: process.env as Record<string, string | undefined>,
    cookie: cookieFromRequest(req.headers.cookie),
  })
  if (!board) {
    res.status(404).json({ error: 'no snapshot yet' })
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(board)
}
