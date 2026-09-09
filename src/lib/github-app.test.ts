import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { convertAppManifest, githubAppJwt } from './github-app'

function testPem(): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  return privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
}

describe('githubAppJwt', () => {
  it('signs an RS256 JWT whose payload names the App id', () => {
    const pem = testPem()
    const token = githubAppJwt('12345', pem, Date.parse('2026-09-09T12:00:00.000Z'))
    const [, payload] = token.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      iss: string
      iat: number
      exp: number
    }
    expect(decoded.iss).toBe('12345')
    expect(decoded.exp - decoded.iat).toBe(10 * 60)
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('convertAppManifest', () => {
  it('POSTs the one-shot code and keeps the PEM off the return path of callers that map fields', async () => {
    const converted = await convertAppManifest('abc', async (url, init) => {
      expect(url).toBe('https://api.github.com/app-manifests/abc/conversions')
      expect(init?.method).toBe('POST')
      return Response.json({
        id: 7,
        slug: 'the-pass',
        name: 'The Pass',
        html_url: 'https://github.com/apps/the-pass',
        pem: 'SECRET_PEM',
        webhook_secret: 'hook',
      })
    })
    expect(converted.id).toBe(7)
    expect(converted.slug).toBe('the-pass')
    expect(converted.pem).toBe('SECRET_PEM')
  })
})
