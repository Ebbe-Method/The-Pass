import type { BoardSnapshot } from '../kiosk/types'
import { putBoard, getBoard } from './board-store.ts'
import {
  listInstallationRepos,
  listOpenIssues,
  resolveInstallationToken,
  resolveRepoToken,
} from './github-app.ts'
import { snapshotTicketsFromGithubIssues } from './github-snapshot.ts'
import type { RepoRef } from './install-flow.ts'

export type RefreshCtx = {
  env?: Record<string, string | undefined>
  cookie?: string
  http?: typeof fetch
}

function envOf(ctx: RefreshCtx): Record<string, string | undefined> {
  return ctx.env ?? (globalThis.process?.env as Record<string, string | undefined>) ?? {}
}

export async function snapshotBoardFromGithub(
  owner: string,
  repo: string,
  token: string,
  http: typeof fetch = fetch,
): Promise<BoardSnapshot> {
  const issues = await listOpenIssues(token, owner, repo, http)
  return putBoard({
    owner,
    repo,
    tickets: snapshotTicketsFromGithubIssues(owner, repo, issues),
    generatedAt: new Date().toISOString(),
  })
}

export async function getOrRefreshBoard(
  owner: string,
  repo: string,
  ctx: RefreshCtx = {},
): Promise<BoardSnapshot | undefined> {
  const cached = getBoard(owner, repo)
  if (cached && cached.tickets.length > 0) return cached
  const token = await resolveRepoToken(
    owner,
    repo,
    envOf(ctx),
    ctx.cookie,
    ctx.http,
  )
  if (!token) return cached
  try {
    return await snapshotBoardFromGithub(owner, repo, token, ctx.http)
  } catch {
    return cached
  }
}

export async function snapshotInstallationRepos(
  installationId: number,
  ctx: RefreshCtx = {},
): Promise<RepoRef[]> {
  const token = await resolveInstallationToken(
    installationId,
    envOf(ctx),
    ctx.cookie,
    ctx.http,
  )
  if (!token) return []
  const repos = await listInstallationRepos(token, ctx.http)
  await Promise.all(
    repos.map((repo) =>
      snapshotBoardFromGithub(repo.owner, repo.name, token, ctx.http),
    ),
  )
  return repos
}

export async function snapshotKnownRepos(
  repos: RepoRef[],
  token: string,
  http: typeof fetch = fetch,
): Promise<BoardSnapshot[]> {
  return Promise.all(
    repos.map((repo) =>
      snapshotBoardFromGithub(repo.owner, repo.name, token, http),
    ),
  )
}
