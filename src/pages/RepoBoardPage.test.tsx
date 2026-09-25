import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RepoBoardPage } from '@/pages/RepoBoardPage'

function renderBoard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:owner/:repo" element={<RepoBoardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('live repo kiosk', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not paint demo fixtures when the board API has no snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'no snapshot yet' }),
      }),
    )
    renderBoard('/acme/widgets')
    await waitFor(() => {
      expect(screen.getByText(/The pass is clear/i)).toBeInTheDocument()
    })
    expect(
      screen.queryByText(/Merge-queue attestation/i),
    ).not.toBeInTheDocument()
  })

  it('paints live tickets when the board API returns them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          owner: 'acme',
          repo: 'widgets',
          tickets: [
            {
              id: '1',
              number: 7,
              kind: 'issue',
              title: 'Heat the pass',
              url: 'https://github.com/acme/widgets/issues/7',
              openedAt: new Date().toISOString(),
              size: 'S',
              labels: ['status:in-flight'],
              events: [],
              ci: 'none',
              hasLinkedPr: false,
              commentCount: 0,
              runtime: 'unknown',
            },
          ],
        }),
      }),
    )
    renderBoard('/acme/widgets')
    expect(await screen.findByText(/Heat the pass/i)).toBeInTheDocument()
    expect(screen.queryByText(/Demo · no GitHub login/i)).not.toBeInTheDocument()
  })

  it('keeps the last live board when a later poll fails', async () => {
    const liveTicket = {
      id: '1',
      number: 7,
      kind: 'issue' as const,
      title: 'Heat the pass',
      url: 'https://github.com/acme/widgets/issues/7',
      openedAt: new Date().toISOString(),
      size: 'S' as const,
      labels: ['status:needs-rob'],
      events: [],
      ci: 'none' as const,
      hasLinkedPr: false,
      commentCount: 0,
      runtime: 'unknown' as const,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          owner: 'acme',
          repo: 'widgets',
          tickets: [liveTicket],
        }),
      })
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'github down' }),
      })
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderBoard('/acme/widgets')
    expect(await screen.findByText(/Heat the pass/i)).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    expect(screen.getByText(/Heat the pass/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/Merge-queue attestation/i),
    ).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
