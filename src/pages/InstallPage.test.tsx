import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InstallPage } from '@/pages/InstallPage'

function renderInstall(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/install" element={<InstallPage />} />
        <Route
          path="/:owner/:repo"
          element={<div>kiosk ready</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InstallPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('converts a manifest code and sends the browser to GitHub install', async () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          installUrl: 'https://github.com/apps/the-pass/installations/new',
          persisted: false,
        }),
      }),
    )
    renderInstall('/install?code=abc')
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        'https://github.com/apps/the-pass/installations/new',
      )
    })
  })

  it('sends a one-repo installation to the kiosk', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          repos: [{ owner: 'Ebbe-Method', name: 'kitchen-board' }],
          kioskPath: '/Ebbe-Method/kitchen-board',
        }),
      }),
    )
    renderInstall('/install?installation_id=99')
    expect(await screen.findByText(/kiosk ready/i)).toBeInTheDocument()
  })

  it('lets the operator pick when GitHub returns several repos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          repos: [
            { owner: 'acme', name: 'one' },
            { owner: 'acme', name: 'two' },
          ],
          kioskPath: null,
        }),
      }),
    )
    renderInstall('/install?installation_id=99')
    expect(await screen.findByText('acme/one')).toBeInTheDocument()
    expect(screen.getByText('acme/two')).toBeInTheDocument()
  })
})
