import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  cookieFromRequest,
  persistAppToVercel,
  rememberApp,
  serializeAppCookie,
} from '../src/lib/app-credentials'
import { convertAppManifest } from '../src/lib/github-app'
import { snapshotInstallationRepos } from '../src/lib/board-refresh'
import { installUrlForApp, kioskPathForRepos } from '../src/lib/install-flow'

function env(): Record<string, string | undefined> {
  return process.env
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const body = (req.body ?? {}) as {
    code?: string
    installation_id?: string | number
  }
  const cookie = cookieFromRequest(req.headers.cookie)

  if (body.code) {
    try {
      const app = await convertAppManifest(body.code)
      rememberApp(app)
      const persisted = await persistAppToVercel(app, env())
      res.setHeader('Set-Cookie', serializeAppCookie(app))
      res.status(200).json({
        id: app.id,
        slug: app.slug,
        html_url: app.html_url,
        installUrl: installUrlForApp(app.html_url),
        persisted,
      })
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'conversion failed',
      })
    }
    return
  }

  const installationId = Number(body.installation_id)
  if (!Number.isFinite(installationId) || installationId <= 0) {
    res.status(400).json({ error: 'missing code or installation_id' })
    return
  }

  try {
    const repos = await snapshotInstallationRepos(installationId, {
      env: env(),
      cookie,
    })
    res.status(200).json({
      repos,
      kioskPath: kioskPathForRepos(repos),
    })
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'install snapshot failed',
    })
  }
}
