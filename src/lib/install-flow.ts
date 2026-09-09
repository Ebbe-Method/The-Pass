export type RepoRef = { owner: string; name: string }

export function installUrlForApp(htmlUrl: string): string {
  return `${htmlUrl.replace(/\/$/, '')}/installations/new`
}

export function kioskPathForRepos(repos: RepoRef[]): string | null {
  if (repos.length === 1) return `/${repos[0].owner}/${repos[0].name}`
  return null
}

export function reposFromInstallationPayload(
  body: Record<string, unknown>,
): RepoRef[] {
  const rows = (body.repositories ??
    body.repositories_added ??
    []) as Array<{
    name?: string
    full_name?: string
    owner?: { login?: string }
  }>
  return rows
    .map((repo) => {
      if (repo.full_name?.includes('/')) {
        const [owner, name] = repo.full_name.split('/')
        if (owner && name) return { owner, name }
      }
      const owner = repo.owner?.login
      if (owner && repo.name) return { owner, name: repo.name }
      return null
    })
    .filter((row): row is RepoRef => row !== null)
}

export function installationIdFromPayload(
  body: Record<string, unknown>,
): number | null {
  const installation = body.installation as { id?: number } | undefined
  const id = Number(installation?.id)
  return Number.isFinite(id) && id > 0 ? id : null
}
