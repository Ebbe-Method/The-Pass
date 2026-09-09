import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyGithubEvent, applyInstallation } from '../src/lib/board-store'

type RepoRef = { name?: string; full_name?: string; owner?: { login?: string } }

function reposFromBody(body: Record<string, unknown>): Array<{ owner: string; name: string }> {
  const repos = (body.repositories ??
    body.repositories_added ??
    []) as RepoRef[]
  return repos
    .map((repo) => {
      if (repo.full_name?.includes('/')) {
        const [owner, name] = repo.full_name.split('/')
        return { owner, name }
      }
      const owner = repo.owner?.login
      if (owner && repo.name) return { owner, name: repo.name }
      return null
    })
    .filter((row): row is { owner: string; name: string } => row !== null)
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const body = (req.body ?? {}) as Record<string, unknown>
  const eventName = String(req.headers['x-github-event'] ?? 'issues')

  if (eventName === 'installation' || eventName === 'installation_repositories') {
    const seeded = reposFromBody(body).map((repo) => applyInstallation(repo.owner, repo.name))
    res.status(200).json({ ok: true, boards: seeded.length })
    return
  }

  const repo = (body.repository ?? {}) as {
    owner?: { login?: string }
    name?: string
  }
  const owner = repo.owner?.login
  const name = repo.name
  if (!owner || !name) {
    res.status(400).json({ error: 'missing repository' })
    return
  }
  const snapshot = applyGithubEvent(owner, name, {
    name: eventName,
    payload: body,
  })
  res.status(200).json({ ok: true, tickets: snapshot.tickets.length })
}
