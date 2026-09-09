import { render, screen, waitFor } from '@testing-library/react'
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
              labels: [],
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
})
