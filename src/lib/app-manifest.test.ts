import { describe, expect, it } from 'vitest'
import { githubAppManifest, PUBLIC_HOST, REPO_HOME } from './app-manifest'

describe('githubAppManifest', () => {
  it('posts a one-click App create payload at the hosted kiosk', () => {
    const manifest = githubAppManifest()
    expect(REPO_HOME).toBe('https://github.com/Ebbe-Method/kitchen-board')
    expect(manifest.url).toBe(REPO_HOME)
    expect(manifest.hook_attributes.url).toBe(`${PUBLIC_HOST}/api/webhook`)
    expect(manifest.redirect_url).toBe(`${PUBLIC_HOST}/install`)
    expect(manifest.setup_url).toBe(`${PUBLIC_HOST}/install`)
    expect(manifest.default_permissions.issues).toBe('read')
    expect(manifest.default_events).toContain('check_run')
  })
})
