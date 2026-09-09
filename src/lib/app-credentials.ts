export const APP_COOKIE = 'the_pass_app'

export type StoredApp = {
  id: number
  pem: string
  webhook_secret: string
  slug?: string
  html_url?: string
}

let memory: StoredApp | null = null

export function rememberApp(app: StoredApp | null): void {
  memory = app
}

export function rememberedApp(): StoredApp | null {
  return memory
}

export function normalizePrivateKey(pem: string): string {
  return pem.replace(/\\n/g, '\n').trim()
}

export function appFromEnv(
  env: Record<string, string | undefined>,
): StoredApp | null {
  const id = Number(env.GITHUB_APP_ID)
  const pem = env.GITHUB_APP_PRIVATE_KEY
  if (!Number.isFinite(id) || id <= 0 || !pem) return null
  return {
    id,
    pem: normalizePrivateKey(pem),
    webhook_secret: env.GITHUB_WEBHOOK_SECRET ?? '',
  }
}

export function parseAppCookie(header?: string): StoredApp | null {
  if (!header) return null
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${APP_COOKIE}=`))
  if (!match) return null
  const raw = match.slice(`${APP_COOKIE}=`.length)
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    ) as Partial<StoredApp>
    if (!parsed.id || !parsed.pem) return null
    return {
      id: Number(parsed.id),
      pem: normalizePrivateKey(String(parsed.pem)),
      webhook_secret: String(parsed.webhook_secret ?? ''),
      slug: parsed.slug,
      html_url: parsed.html_url,
    }
  } catch {
    return null
  }
}

export function serializeAppCookie(app: StoredApp): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: app.id,
      pem: app.pem,
      webhook_secret: app.webhook_secret,
      slug: app.slug,
      html_url: app.html_url,
    }),
    'utf8',
  ).toString('base64url')
  return `${APP_COOKIE}=${payload}; HttpOnly; Secure; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function readStoredApp(
  env: Record<string, string | undefined>,
  cookieHeader?: string,
): StoredApp | null {
  return appFromEnv(env) ?? memory ?? parseAppCookie(cookieHeader)
}

export function githubTokenFromEnv(
  env: Record<string, string | undefined>,
): string | undefined {
  return env.GITHUB_TOKEN || env.GITHUB_PAT || undefined
}

export function cookieFromRequest(header: string | string[] | undefined): string | undefined {
  if (!header) return undefined
  return Array.isArray(header) ? header.join('; ') : header
}

export async function persistAppToVercel(
  app: StoredApp,
  env: Record<string, string | undefined>,
  http: typeof fetch = fetch,
): Promise<boolean> {
  const token = env.VERCEL_TOKEN || env.THE_PASS_VERCEL_TOKEN
  const projectId = env.VERCEL_PROJECT_ID
  const teamId = env.VERCEL_ORG_ID || env.VERCEL_TEAM_ID
  if (!token || !projectId) return false
  const team = teamId ? `&teamId=${encodeURIComponent(teamId)}` : ''
  const rows = [
    { key: 'GITHUB_APP_ID', value: String(app.id) },
    { key: 'GITHUB_APP_PRIVATE_KEY', value: app.pem },
    { key: 'GITHUB_WEBHOOK_SECRET', value: app.webhook_secret },
  ]
  const res = await http(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env?upsert=true${team}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        rows.map((row) => ({
          key: row.key,
          value: row.value,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        })),
      ),
    },
  )
  return res.ok
}
