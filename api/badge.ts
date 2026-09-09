import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cookieFromRequest } from '../src/lib/app-credentials'
import { getOrRefreshBoard } from '../src/lib/board-refresh'
import { heatFor } from '../src/lib/freshness'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://local')
  const owner = url.searchParams.get('owner') ?? 'demo'
  const repo = url.searchParams.get('repo') ?? 'kitchen'
  const board = await getOrRefreshBoard(owner, repo, {
    env: process.env as Record<string, string | undefined>,
    cookie: cookieFromRequest(req.headers.cookie),
  })
  const now = Date.now()
  const hot = board?.tickets.filter((t) => heatFor(t, now) === 'hot').length ?? 0
  const label = hot > 0 ? `${hot} hot` : 'cool'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="20">
  <rect width="168" height="20" rx="3" fill="#100e0c"/>
  <rect width="70" height="20" rx="3" fill="#ff5a1f"/>
  <text x="35" y="14" text-anchor="middle" fill="#100e0c" font-size="11">the pass</text>
  <text x="118" y="14" text-anchor="middle" fill="#f3ead7" font-size="11">${label}</text>
</svg>`
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'no-cache')
  res.status(200).send(svg)
}
