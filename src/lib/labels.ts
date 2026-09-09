import type { Size } from '../kiosk/types'

export function sizeFromLabels(labels: string[]): Size {
  for (const label of labels) {
    const match = /^size:(S|M|L|XL)$/i.exec(label)
    if (match) return match[1].toUpperCase() as Size
  }
  return 'M'
}
