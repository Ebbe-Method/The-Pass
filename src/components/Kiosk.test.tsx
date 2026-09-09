import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Kiosk } from '@/components/Kiosk'
import { demoTickets } from '@/fixtures/tickets'

describe('Kiosk magic moment', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds the tear-in ticket until 8 seconds, then shows it hot', () => {
    vi.useFakeTimers()
    render(
      <Kiosk
        tickets={demoTickets}
        owner="fuseon-connections"
        repo="fuse-on-v2"
        demo
      />,
    )
    expect(
      screen.queryByText(/Unstick the waiting-on-you rail/i),
    ).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(
      screen.getByText(/Unstick the waiting-on-you rail/i),
    ).toBeInTheDocument()
  })
})
