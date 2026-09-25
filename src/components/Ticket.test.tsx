import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TicketCard } from '@/components/Ticket'
import type { Ticket } from '@/kiosk/types'
import { presentTicket } from '@/lib/present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 12,
    kind: 'pr',
    title: 'Sized chit',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'L',
    labels: ['status:needs-rob', 'status:in-flight'],
    events: [],
    ci: 'none',
    hasLinkedPr: true,
    commentCount: 1,
    ...partial,
  }
}

describe('TicketCard', () => {
  it('exposes size, counts down to stale, and prints one kitchen chip', () => {
    const now = Date.parse('2026-09-09T12:15:00.000Z')
    const row = presentTicket(ticket(), now)
    const { container } = render(
      <TicketCard row={row} onOpen={() => undefined} />,
    )
    const chit = container.querySelector('.ticket')
    expect(chit).toHaveAttribute('data-size', 'L')
    expect(screen.getByText('walk')).toBeInTheDocument()
    expect(screen.getByText('3h 45m')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('needs-rob')).toBeInTheDocument()
    expect(screen.queryByText('in-flight')).not.toBeInTheDocument()
  })
})
