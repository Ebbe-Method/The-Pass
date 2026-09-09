import { describe, expect, it } from 'vitest'
import { sizeFromLabels } from './labels'

describe('sizeFromLabels', () => {
  it('reads size:S through size:XL', () => {
    expect(sizeFromLabels(['ready-for-agent', 'size:S'])).toBe('S')
    expect(sizeFromLabels(['size:XL'])).toBe('XL')
  })

  it('defaults to M when the size label is missing', () => {
    expect(sizeFromLabels(['status:in-flight'])).toBe('M')
  })
})
