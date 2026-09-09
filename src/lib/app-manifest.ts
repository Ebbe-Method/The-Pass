export const PUBLIC_HOST = 'https://the-pass-theta.vercel.app'
export const REPO_HOME = 'https://github.com/Ebbe-Method/kitchen-board'

export type GithubAppManifest = {
  name: string
  url: string
  hook_attributes: { url: string; active: boolean }
  redirect_url: string
  callback_urls: string[]
  setup_url: string
  public: boolean
  default_permissions: {
    issues: 'read'
    pull_requests: 'read'
    checks: 'read'
    metadata: 'read'
  }
  default_events: string[]
}

export function githubAppManifest(host = PUBLIC_HOST): GithubAppManifest {
  return {
    name: 'The Pass',
    url: REPO_HOME,
    hook_attributes: {
      url: `${host}/api/webhook`,
      active: true,
    },
    redirect_url: `${host}/install`,
    callback_urls: [`${host}/install`],
    setup_url: `${host}/install`,
    public: true,
    default_permissions: {
      issues: 'read',
      pull_requests: 'read',
      checks: 'read',
      metadata: 'read',
    },
    default_events: [
      'issues',
      'issue_comment',
      'pull_request',
      'pull_request_review',
      'push',
      'check_run',
      'workflow_run',
    ],
  }
}
