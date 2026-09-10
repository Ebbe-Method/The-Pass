import { afterEach, describe, expect, it } from 'vitest'
import {
  APP_COOKIE,
  parseAppCookie,
  persistAppToVercel,
  readStoredApp,
  rememberApp,
  serializeAppCookie,
} from './app-credentials'

const sample = {
  id: 42,
  pem: '-----BEGIN RSA PRIVATE KEY-----\nMIIB\n-----END RSA PRIVATE KEY-----',
  webhook_secret: 'shhh',
  slug: 'the-pass',
}

afterEach(() => {
  rememberApp(null)
})

describe('app credentials', () => {
  it('round-trips the httpOnly cookie without exposing a readable PEM in the name', () => {
    const header = serializeAppCookie(sample)
    expect(header.startsWith(`${APP_COOKIE}=`)).toBe(true)
    expect(header).toContain('HttpOnly')
    expect(header).not.toContain('BEGIN RSA')
    const parsed = parseAppCookie(header.split(';')[0])
    expect(parsed?.id).toBe(42)
    expect(parsed?.pem).toContain('BEGIN RSA PRIVATE KEY')
  })

  it('prefers env over memory over cookie', () => {
    rememberApp(sample)
    const fromEnv = readStoredApp(
      { GITHUB_APP_ID: '99', GITHUB_APP_PRIVATE_KEY: 'env-pem' },
      serializeAppCookie(sample),
    )
    expect(fromEnv?.id).toBe(99)
    expect(fromEnv?.pem).toBe('env-pem')
  })

  it('upserts Vercel env when a token and project id are present', async () => {
    const calls: string[] = []
    const ok = await persistAppToVercel(
      sample,
      {
        VERCEL_TOKEN: 'token',
        VERCEL_PROJECT_ID: 'prj_test',
        VERCEL_ORG_ID: 'team_test',
      },
      async (url, init) => {
        calls.push(`${init?.method} ${url}`)
        return new Response('{}', { status: 200 })
      },
    )
    expect(ok).toBe(true)
    expect(calls[0]).toContain('upsert=true')
    expect(calls[0]).toContain('teamId=team_test')
  })
})
