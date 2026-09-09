import type { ProgressKind } from '../kiosk/types'

export type ClassifiedEvent = {
  kind: ProgressKind
  label: string
  bot: boolean
}

export type IncomingGithubEvent = {
  name: string
  payload: Record<string, unknown>
}

function userIsBot(payload: Record<string, unknown>): boolean {
  const comment = payload.comment as { user?: { type?: string } } | undefined
  return comment?.user?.type === 'Bot'
}

export function classifyGithubEvent(
  event: IncomingGithubEvent,
): ClassifiedEvent | null {
  const { name, payload } = event
  const action = payload.action as string | undefined

  if (name === 'projects_v2_item') return null
  if (name === 'issues' && action === 'edited') return null

  if (name === 'push') {
    const commits = payload.commits as unknown[] | undefined
    if (commits && commits.length > 0) {
      return { kind: 'commit', label: 'commit', bot: false }
    }
    return null
  }

  if (name === 'pull_request_review' && action === 'submitted') {
    return { kind: 'review', label: 'review submitted', bot: false }
  }

  if (name === 'check_run' && action === 'completed') {
    const check = payload.check_run as { conclusion?: string } | undefined
    return { kind: 'ci', label: `CI ${check?.conclusion ?? 'done'}`, bot: false }
  }

  if (name === 'workflow_run' && action === 'completed') {
    const run = payload.workflow_run as { conclusion?: string } | undefined
    return { kind: 'ci', label: `CI ${run?.conclusion ?? 'done'}`, bot: false }
  }

  if (name === 'issue_comment' && action === 'created') {
    return { kind: 'comment', label: 'comment', bot: userIsBot(payload) }
  }

  if ((name === 'issues' || name === 'pull_request') && action === 'labeled') {
    const label = payload.label as { name?: string } | undefined
    return { kind: 'label', label: label?.name ?? 'label', bot: false }
  }

  return null
}
