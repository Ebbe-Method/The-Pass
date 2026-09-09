import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
    expect(manifest.setup_on_update).toBe(true)
    expect(manifest.default_permissions.issues).toBe('read')
    expect(manifest.default_permissions.contents).toBe('read')
    expect(manifest.default_permissions.actions).toBe('read')
    expect(manifest.default_events).toContain('push')
    expect(manifest.default_events).toContain('workflow_run')
    expect(manifest.default_events).toContain('check_run')
  })

  it('keeps public/app-manifest.json in lockstep with the install form payload', () => {
    const published = JSON.parse(
      readFileSync(join(process.cwd(), 'public/app-manifest.json'), 'utf8'),
    ) as ReturnType<typeof githubAppManifest>
    const manifest = githubAppManifest()
    expect(published.default_permissions).toEqual(manifest.default_permissions)
    expect(published.default_events).toEqual(manifest.default_events)
  })
})
