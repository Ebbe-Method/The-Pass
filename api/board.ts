import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBoard } from '../src/lib/board-store'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const owner = String(req.query.owner ?? '')
  const repo = String(req.query.repo ?? '')
  if (!owner || !repo) {
    res.status(400).json({ error: 'missing owner/repo' })
    return
  }
  const board = getBoard(owner, repo)
  if (!board) {
    res.status(404).json({ error: 'no snapshot yet' })
    return
  }
  res.status(200).json(board)
}
