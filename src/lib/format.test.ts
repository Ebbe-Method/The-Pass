import { describe, expect, it } from 'vitest'
import { formatClock } from './format'

describe('formatClock', () => {
  it('says just in under a minute', () => {
    expect(formatClock(12_000)).toBe('just in')
  })

  it('uses minutes under an hour', () => {
    expect(formatClock(12 * 60 * 1000)).toBe('12m')
  })

  it('uses hours and minutes under a day', () => {
    expect(formatClock(3 * 60 * 60 * 1000 + 12 * 60 * 1000)).toBe('3h 12m')
  })

  it('uses days after 24 hours', () => {
    expect(formatClock(2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)).toBe('2d 4h')
  })
})
