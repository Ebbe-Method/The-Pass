import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Rail } from '@/components/Rail'
import type { Ticket } from '@/kiosk/types'
import { presentTicket } from '@/lib/present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'Queued only',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'S',
    labels: [],
    events: [],
    ci: 'none',
    hasLinkedPr: false,
    commentCount: 0,
    ...partial,
  }
}

describe('Rail expo layout', () => {
  it('does not call the pass clear when the well has tickets', () => {
    const now = Date.parse('2026-09-09T12:10:00.000Z')
    const rows = [presentTicket(ticket(), now)]
    render(<Rail rows={rows} layout="expo" onOpen={() => undefined} />)
    expect(screen.getByText(/1 in the well/i)).toBeInTheDocument()
    expect(screen.queryByText(/The pass is clear/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Queued only/i)).not.toBeInTheDocument()
  })

  it('puts waiting tickets in the expo strip and sizes the line', () => {
    const now = Date.parse('2026-09-09T12:10:00.000Z')
    const waiting = presentTicket(
      ticket({
        id: 'w',
        number: 2,
        title: 'Needs a click',
        labels: ['status:needs-rob'],
        size: 'S',
      }),
      now,
    )
    const cooking = presentTicket(
      ticket({
        id: 'c',
        number: 3,
        title: 'Agent plate',
        kind: 'pr',
        size: 'XL',
        labels: ['status:in-flight'],
        hasLinkedPr: true,
        commentCount: 2,
        ci: 'pending',
      }),
      now,
    )
    const { container } = render(
      <Rail rows={[waiting, cooking]} layout="expo" onOpen={() => undefined} />,
    )
    expect(container.querySelector('.pass-expo')?.querySelector('[data-size="S"]')).toBeTruthy()
    expect(container.querySelector('.pass-line')?.querySelector('[data-size="XL"]')).toBeTruthy()
    expect(screen.getByText(/Needs a click/i)).toBeInTheDocument()
    expect(screen.getByText(/Agent plate/i)).toBeInTheDocument()
  })
})
