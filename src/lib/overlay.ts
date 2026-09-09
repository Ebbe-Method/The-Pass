import type { ActorRuntime, Ticket } from '../kiosk/types'
import type { CursorAgent } from './cursor-match'
import { matchCursorAgent, sessionUrlFor } from './cursor-match'
import { parseKitchenClaim } from './heartbeat'

const RUNTIMES: ActorRuntime[] = [
  'cursor',
  'claude',
  'copilot',
  'human',
  'bot',
  'unknown',
]

function asRuntime(value: string): ActorRuntime {
  return RUNTIMES.includes(value as ActorRuntime)
    ? (value as ActorRuntime)
    : 'unknown'
}

export function applyRuntimeOverlay(
  ticket: Ticket,
  input: { html?: string; agents?: CursorAgent[] } = {},
): Ticket {
  const claim = input.html ? parseKitchenClaim(input.html) : null
  if (claim) {
    return {
      ...ticket,
      runtime: asRuntime(claim.runtime),
      sessionUrl: claim.session ?? ticket.sessionUrl,
    }
  }

  const agent = (input.agents ?? []).find((candidate) =>
    matchCursorAgent(candidate, ticket),
  )
  if (agent) {
    return {
      ...ticket,
      runtime: 'cursor',
      sessionUrl: sessionUrlFor(agent.bcId),
    }
  }

  return {
    ...ticket,
    runtime: ticket.runtime ?? 'unknown',
  }
}
