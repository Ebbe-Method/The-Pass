import type { Size } from '../kiosk/types'

export const COVERS: Record<Size, number> = {
  S: 1,
  M: 2,
  L: 4,
  XL: 8,
}

export const HUMAN_COVER_CAP = 8
export const AGENT_COVER_CAP = 24

export function coversFor(size: Size): number {
  return COVERS[size]
}
