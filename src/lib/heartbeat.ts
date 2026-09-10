import type { ActorRuntime } from '../kiosk/types'

export type KitchenClaim = {
  runtime: ActorRuntime
  session?: string
}

const CLAIM =
  /<!--\s*kitchen:claim\s+runtime="([^"]+)"(?:\s+session="([^"]+)")?\s*-->/

export function parseKitchenClaim(html: string): KitchenClaim | null {
  const match = html.match(CLAIM)
  if (!match) return null
  const runtime = match[1] as ActorRuntime
  const session = match[2] || undefined
  return { runtime, session }
}
