import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cookieFromRequest } from '../src/lib/app-credentials.ts'
import { snapshotBoardFromGithub } from '../src/lib/board-refresh.ts'
import { applyGithubEvent, applyInstallation, getBoard } from '../src/lib/board-store.ts'
import { resolveInstallationToken, resolveRepoToken } from '../src/lib/github-app.ts'
import {
  installationIdFromPayload,
  reposFromInstallationPayload,
} from '../src/lib/install-flow.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const body = (req.body ?? {}) as Record<string, unknown>
  const eventName = String(req.headers['x-github-event'] ?? 'issues')
  const cookie = cookieFromRequest(req.headers.cookie)
  const env = process.env as Record<string, string | undefined>

  if (eventName === 'installation' || eventName === 'installation_repositories') {
    const repos = reposFromInstallationPayload(body)
    const installationId = installationIdFromPayload(body)
    const token = installationId
      ? await resolveInstallationToken(installationId, env, cookie)
      : null
    if (token) {
      const boards = await Promise.all(
        repos.map((repo) =>
          snapshotBoardFromGithub(repo.owner, repo.name, token),
        ),
      )
      res.status(200).json({ ok: true, boards: boards.length })
      return
    }
    const seeded = repos.map((repo) => applyInstallation(repo.owner, repo.name))
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

  if (!getBoard(owner, name)?.tickets.length) {
    const token = await resolveRepoToken(owner, name, env, cookie).catch(
      () => null,
    )
    if (token) {
      await snapshotBoardFromGithub(owner, name, token).catch(() => undefined)
    }
  }

  const snapshot = applyGithubEvent(owner, name, {
    name: eventName,
    payload: body,
  })
  res.status(200).json({ ok: true, tickets: snapshot.tickets.length })
}
