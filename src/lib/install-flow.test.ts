import { describe, expect, it } from 'vitest'
import {
  installationIdFromPayload,
  installUrlForApp,
  kioskPathForRepos,
  reposFromInstallationPayload,
} from './install-flow'

describe('install flow helpers', () => {
  it('builds the GitHub App install URL from the App html_url', () => {
    expect(installUrlForApp('https://github.com/apps/the-pass')).toBe(
      'https://github.com/apps/the-pass/installations/new',
    )
  })

  it('sends a one-repo install straight to the kiosk path', () => {
    expect(
      kioskPathForRepos([{ owner: 'Ebbe-Method', name: 'kitchen-board' }]),
    ).toBe('/Ebbe-Method/kitchen-board')
    expect(
      kioskPathForRepos([
        { owner: 'acme', name: 'one' },
        { owner: 'acme', name: 'two' },
      ]),
    ).toBeNull()
  })

  it('reads repos and installation id from the webhook payload', () => {
    expect(
      reposFromInstallationPayload({
        installation: { id: 88 },
        repositories: [{ full_name: 'Ebbe-Method/kitchen-board' }],
      }),
    ).toEqual([{ owner: 'Ebbe-Method', name: 'kitchen-board' }])
    expect(
      installationIdFromPayload({ installation: { id: 88 } }),
    ).toBe(88)
  })
})
