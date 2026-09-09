import { describe, expect, it } from 'vitest'
import { matchCursorAgent } from './cursor-match'

describe('matchCursorAgent', () => {
  it('matches on branch name that includes the issue number', () => {
    const agent = {
      bcId: 'bc-1',
      branchName: 'cursor/wire-heartbeat-1234',
      name: 'Wire heartbeat',
      status: 'RUNNING' as const,
    }
    expect(matchCursorAgent(agent, { number: 1234, title: 'Wire heartbeat' })).toBe(true)
  })

  it('matches when the agent name contains #number', () => {
    const agent = {
      bcId: 'bc-2',
      branchName: 'feat/something',
      name: 'Fix stale #99 on the pass',
      status: 'IDLE' as const,
    }
    expect(matchCursorAgent(agent, { number: 99, title: 'Fix stale' })).toBe(true)
  })

  it('does not match a different ticket', () => {
    const agent = {
      bcId: 'bc-3',
      branchName: 'cursor/other-1',
      name: 'Unrelated',
      status: 'RUNNING' as const,
    }
    expect(matchCursorAgent(agent, { number: 50, title: 'Something else' })).toBe(false)
  })

  it('does not match 384 inside branch 3840', () => {
    const agent = {
      bcId: 'bc-4',
      branchName: 'cursor/kitchen-claim-3840',
      name: 'Heartbeat',
      status: 'RUNNING' as const,
    }
    expect(matchCursorAgent(agent, { number: 384, title: 'Almost' })).toBe(false)
  })
})
