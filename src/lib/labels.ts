import type { Size, TicketKind } from '../kiosk/types'

export const SHORT_PR_BODY_CHARS = 400
export const LONG_BODY_CHARS = 1500

export type SizeHints = {
  kind: TicketKind
  labels: string[]
  body?: string | null
  milestone?: unknown
}

export type KitchenStatus = 'needs-rob' | 'in-flight'

export function sizeFromLabels(labels: string[]): Size | null {
  for (const label of labels) {
    const match = /^size:(S|M|L|XL)$/i.exec(label)
    if (match) return match[1].toUpperCase() as Size
  }
  return null
}

function hasEpic(labels: string[]): boolean {
  return labels.some((label) => label.toLowerCase() === 'epic')
}

function hasMilestone(milestone: unknown): boolean {
  return milestone != null
}

export function inferSize(hints: SizeHints): Size {
  if (hasEpic(hints.labels) || hasMilestone(hints.milestone)) return 'XL'
  const bodyLen = hints.body?.length ?? 0
  if (hints.kind === 'pr' && bodyLen < SHORT_PR_BODY_CHARS) return 'S'
  if (bodyLen >= LONG_BODY_CHARS) return 'L'
  return 'M'
}

export function sizeForTicket(hints: SizeHints): Size {
  return sizeFromLabels(hints.labels) ?? inferSize(hints)
}

export function kitchenChip(labels: string[]): KitchenStatus | null {
  const names = labels.map((label) => label.toLowerCase())
  if (names.includes('status:needs-rob')) return 'needs-rob'
  if (names.includes('status:in-flight')) return 'in-flight'
  return null
}
