import { describe, expect, it } from 'vitest'
import { classifyGithubEvent } from './github-events'

describe('classifyGithubEvent', () => {
  it('treats a push on the PR branch as a commit', () => {
    expect(
      classifyGithubEvent({
        name: 'push',
        payload: { commits: [{ id: 'abc' }] },
      }),
    ).toEqual({ kind: 'commit', label: 'commit', bot: false })
  })

  it('treats a submitted review as review', () => {
    expect(
      classifyGithubEvent({
        name: 'pull_request_review',
        payload: { action: 'submitted', review: { state: 'approved' } },
      }),
    ).toEqual({ kind: 'review', label: 'review submitted', bot: false })
  })

  it('treats a completed check run as CI', () => {
    expect(
      classifyGithubEvent({
        name: 'check_run',
        payload: { action: 'completed', check_run: { conclusion: 'success' } },
      }),
    ).toEqual({ kind: 'ci', label: 'CI success', bot: false })
  })

  it('treats a non-bot issue comment as comment', () => {
    expect(
      classifyGithubEvent({
        name: 'issue_comment',
        payload: {
          action: 'created',
          comment: { body: 'ship it', user: { login: 'robweidner', type: 'User' } },
        },
      }),
    ).toEqual({ kind: 'comment', label: 'comment', bot: false })
  })

  it('marks bot issue comments so they are not progress', () => {
    expect(
      classifyGithubEvent({
        name: 'issue_comment',
        payload: {
          action: 'created',
          comment: { body: 'lint', user: { login: 'codecov', type: 'Bot' } },
        },
      }),
    ).toEqual({ kind: 'comment', label: 'comment', bot: true })
  })

  it('ignores description edits', () => {
    expect(
      classifyGithubEvent({
        name: 'issues',
        payload: { action: 'edited' },
      }),
    ).toBeNull()
  })

  it('counts a status label change', () => {
    expect(
      classifyGithubEvent({
        name: 'issues',
        payload: {
          action: 'labeled',
          label: { name: 'status:in-flight' },
        },
      }),
    ).toEqual({ kind: 'label', label: 'status:in-flight', bot: false })
  })

  it('ignores project-board field noise', () => {
    expect(
      classifyGithubEvent({
        name: 'projects_v2_item',
        payload: { action: 'edited' },
      }),
    ).toBeNull()
  })
})
