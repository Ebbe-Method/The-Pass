/// <reference types="node" />
import { createSign } from 'node:crypto'
import {
  githubTokenFromEnv,
  normalizePrivateKey,
  readStoredApp,
  type StoredApp,
} from './app-credentials'
import type { GithubIssueLike } from './github-snapshot'
import type { RepoRef } from './install-flow'

const GITHUB_API = 'https://api.github.com'
const UA = 'the-pass-kiosk'

export type ConvertedApp = StoredApp & {
  slug: string
  html_url: string
  name: string
}

export async function githubJson<T>(
  path: string,
  init: {
    token: string
    method?: string
    body?: unknown
    http?: typeof fetch
  },
): Promise<T> {
  const http = init.http ?? fetch
  const res = await http(`${GITHUB_API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${init.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': UA,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub ${res.status} ${path}: ${text.slice(0, 200)}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function githubAppJwt(
  appId: string | number,
  privateKey: string,
  nowMs = Date.now(),
): string {
  const now = Math.floor(nowMs / 1000)
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: String(appId),
    }),
  ).toString('base64url')
  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = signer.sign(normalizePrivateKey(privateKey), 'base64url')
  return `${unsigned}.${signature}`
}

export async function convertAppManifest(
  code: string,
  http: typeof fetch = fetch,
): Promise<ConvertedApp> {
  const res = await http(
    `${GITHUB_API}/app-manifests/${encodeURIComponent(code)}/conversions`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': UA,
      },
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`manifest conversion failed (${res.status}): ${text.slice(0, 200)}`)
  }
  const body = (await res.json()) as {
    id: number
    slug: string
    name: string
    html_url: string
    pem: string
    webhook_secret: string
  }
  if (!body.id || !body.pem) {
    throw new Error('manifest conversion missing id or pem')
  }
  return {
    id: body.id,
    slug: body.slug,
    name: body.name,
    html_url: body.html_url,
    pem: body.pem,
    webhook_secret: body.webhook_secret ?? '',
  }
}

export async function installationAccessToken(
  app: StoredApp,
  installationId: number,
  http: typeof fetch = fetch,
): Promise<string> {
  const jwt = githubAppJwt(app.id, app.pem)
  const body = await githubJson<{ token: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { token: jwt, method: 'POST', http },
  )
  return body.token
}

export async function installationForRepo(
  app: StoredApp,
  owner: string,
  repo: string,
  http: typeof fetch = fetch,
): Promise<number | null> {
  const jwt = githubAppJwt(app.id, app.pem)
  try {
    const body = await githubJson<{ id: number }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/installation`,
      { token: jwt, http },
    )
    return body.id ?? null
  } catch {
    return null
  }
}

export async function listInstallationRepos(
  token: string,
  http: typeof fetch = fetch,
): Promise<RepoRef[]> {
  const repos: RepoRef[] = []
  for (let page = 1; page <= 5; page += 1) {
    const body = await githubJson<{
      repositories?: Array<{
        name: string
        full_name?: string
        owner?: { login?: string }
      }>
    }>(`/installation/repositories?per_page=100&page=${page}`, { token, http })
    const batch = body.repositories ?? []
    for (const repo of batch) {
      const owner = repo.owner?.login ?? repo.full_name?.split('/')[0]
      if (owner && repo.name) repos.push({ owner, name: repo.name })
    }
    if (batch.length < 100) break
  }
  return repos
}

export async function listOpenIssues(
  token: string,
  owner: string,
  repo: string,
  http: typeof fetch = fetch,
): Promise<GithubIssueLike[]> {
  const issues: GithubIssueLike[] = []
  for (let page = 1; page <= 5; page += 1) {
    const batch = await githubJson<GithubIssueLike[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=100&page=${page}`,
      { token, http },
    )
    issues.push(...batch)
    if (batch.length < 100) break
  }
  return issues
}

export async function resolveRepoToken(
  owner: string,
  repo: string,
  env: Record<string, string | undefined>,
  cookieHeader?: string,
  http: typeof fetch = fetch,
): Promise<string | null> {
  const app = readStoredApp(env, cookieHeader)
  if (app) {
    const installationId = await installationForRepo(app, owner, repo, http)
    if (installationId) {
      return installationAccessToken(app, installationId, http)
    }
  }
  return githubTokenFromEnv(env) ?? null
}

export async function resolveInstallationToken(
  installationId: number,
  env: Record<string, string | undefined>,
  cookieHeader?: string,
  http: typeof fetch = fetch,
): Promise<string | null> {
  const app = readStoredApp(env, cookieHeader)
  if (app) return installationAccessToken(app, installationId, http)
  return githubTokenFromEnv(env) ?? null
}
