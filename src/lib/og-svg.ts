import type { TicketState } from '../kiosk/types'
import { STATE_LABEL } from './freshness.ts'

export type OgTicket = {
  number: number
  title: string
  state: TicketState
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function titleFor(ticket: OgTicket, blur: boolean): string {
  if (!blur) return ticket.title
  return '•••• ••••• •••••'
}

export function boardOgSvg(input: {
  owner: string
  repo: string
  tickets: OgTicket[]
  blur?: boolean
}): string {
  const cards = input.tickets.slice(0, 3)
  const cardSvg = cards
    .map((ticket, index) => {
      const x = 80 + index * 350
      return `<rect x="${x}" y="380" width="320" height="160" fill="#f3ead7"/>
  <text x="${x + 24}" y="430" fill="#1c140c" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600">#${ticket.number} ${escapeXml(STATE_LABEL[ticket.state])}</text>
  <text x="${x + 24}" y="478" fill="#5c4e3e" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18">${escapeXml(titleFor(ticket, Boolean(input.blur)))}</text>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#100e0c"/>
  <text x="80" y="120" fill="#ffb347" font-family="ui-monospace, monospace" font-size="22" letter-spacing="8">THE PASS</text>
  <text x="80" y="200" fill="#f3ead7" font-family="ui-sans-serif, system-ui, sans-serif" font-size="52" font-weight="600">Your agents are cooking.</text>
  <text x="80" y="250" fill="#f3ead7" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" opacity="0.7">${escapeXml(input.owner)}/${escapeXml(input.repo)}</text>
  ${cardSvg}
</svg>`
}
