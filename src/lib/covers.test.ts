import { describe, expect, it } from 'vitest'
import {
  AGENT_COVER_CAP,
  COVERS,
  HUMAN_COVER_CAP,
  coversFor,
} from './covers'

describe('covers', () => {
  it('weights S/M/L/XL as 1/2/4/8', () => {
    expect(COVERS).toEqual({ S: 1, M: 2, L: 4, XL: 8 })
    expect(coversFor('S')).toBe(1)
    expect(coversFor('M')).toBe(2)
    expect(coversFor('L')).toBe(4)
    expect(coversFor('XL')).toBe(8)
  })

  it('caps human expo at 8 and the agent line at 24', () => {
    expect(HUMAN_COVER_CAP).toBe(8)
    expect(AGENT_COVER_CAP).toBe(24)
  })
})
