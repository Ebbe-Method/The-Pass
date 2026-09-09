import { describe, expect, it } from 'vitest'
import { parseKitchenClaim } from './heartbeat'

describe('parseKitchenClaim', () => {
  it('reads runtime and session from the hidden HTML comment', () => {
    const html = `<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-123" -->`
    expect(parseKitchenClaim(html)).toEqual({
      runtime: 'cursor',
      session: 'https://cursor.com/agents/bc-123',
    })
  })

  it('allows a Claude or laptop claim with no session URL', () => {
    expect(parseKitchenClaim('<!-- kitchen:claim runtime="claude" -->')).toEqual({
      runtime: 'claude',
      session: undefined,
    })
  })

  it('returns null when the comment is missing', () => {
    expect(parseKitchenClaim('<p>just a body</p>')).toBeNull()
  })
})
