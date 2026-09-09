import { describe, expect, it } from 'vitest'
import { boardOgSvg } from './og-svg'

describe('boardOgSvg', () => {
  it('renders owner, repo, and ticket numbers', () => {
    const svg = boardOgSvg({
      owner: 'acme',
      repo: 'widgets',
      tickets: [
        { number: 12, title: 'Heat the pass', state: 'waiting_on_you' },
        { number: 44, title: 'Stale claim', state: 'stale' },
      ],
    })
    expect(svg).toContain('acme/widgets')
    expect(svg).toContain('#12')
    expect(svg).toContain('#44')
    expect(svg).toContain('waiting on you')
  })

  it('blurs titles when asked so a still can ship without leaking copy', () => {
    const svg = boardOgSvg({
      owner: 'acme',
      repo: 'widgets',
      blur: true,
      tickets: [{ number: 12, title: 'Secret customer name', state: 'cooking' }],
    })
    expect(svg).not.toContain('Secret customer name')
    expect(svg).toContain('#12')
  })
})
