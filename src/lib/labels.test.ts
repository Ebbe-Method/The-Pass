import { describe, expect, it } from 'vitest'
import {
  inferSize,
  kitchenChip,
  sizeForTicket,
  sizeFromLabels,
} from './labels'

describe('sizeFromLabels', () => {
  it('reads size:S through size:XL', () => {
    expect(sizeFromLabels(['ready-for-agent', 'size:S'])).toBe('S')
    expect(sizeFromLabels(['size:XL'])).toBe('XL')
  })

  it('returns null when the size label is missing', () => {
    expect(sizeFromLabels(['status:in-flight'])).toBeNull()
  })
})

describe('inferSize', () => {
  it('treats epic or a milestone as XL', () => {
    expect(
      inferSize({ kind: 'issue', labels: ['epic'], body: 'short' }),
    ).toBe('XL')
    expect(
      inferSize({
        kind: 'pr',
        labels: [],
        body: 'tiny',
        milestone: { title: 'Launch' },
      }),
    ).toBe('XL')
  })

  it('treats a short unlabeled PR as S', () => {
    expect(
      inferSize({ kind: 'pr', labels: [], body: 'please review' }),
    ).toBe('S')
  })

  it('treats a long unlabeled body as L', () => {
    expect(
      inferSize({ kind: 'issue', labels: [], body: 'x'.repeat(1500) }),
    ).toBe('L')
  })

  it('defaults everything else to M', () => {
    expect(inferSize({ kind: 'issue', labels: [], body: 'hi' })).toBe('M')
  })
})

describe('sizeForTicket', () => {
  it('lets a size label win over epic and body length', () => {
    expect(
      sizeForTicket({
        kind: 'pr',
        labels: ['size:S', 'epic'],
        body: 'x'.repeat(2000),
        milestone: { title: 'Launch' },
      }),
    ).toBe('S')
  })
})

describe('kitchenChip', () => {
  it('prints at most one status and prefers needs-rob', () => {
    expect(kitchenChip(['status:in-flight'])).toBe('in-flight')
    expect(kitchenChip(['status:needs-rob', 'status:in-flight'])).toBe(
      'needs-rob',
    )
    expect(kitchenChip(['ready-for-agent'])).toBeNull()
  })
})
