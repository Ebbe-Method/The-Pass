import { afterEach, describe, expect, it, vi } from 'vitest'
import { rememberApp } from './app-credentials'
import { getOrRefreshBoard, snapshotBoardFromGithub } from './board-refresh'
import { getBoard, putBoard } from './board-store'

afterEach(() => {
  rememberApp(null)
  vi.unstubAllGlobals()
})

describe('snapshotBoardFromGithub', () => {
  it('maps open issues into a stored board', async () => {
    const snapshot = await snapshotBoardFromGithub(
      'Ebbe-Method',
      'kitchen-board',
      'token',
      async (url) => {
        expect(String(url)).toContain(
          '/repos/Ebbe-Method/kitchen-board/issues?state=open',
        )
        return Response.json([
          {
            id: 2,
            number: 2,
            title: 'The Pass — handoff',
            html_url: 'https://github.com/Ebbe-Method/kitchen-board/issues/2',
            created_at: '2026-09-09T12:00:00.000Z',
            labels: [{ name: 'size:M' }],
            comments: 1,
            body: '<!-- kitchen:claim runtime="cursor" -->',
          },
        ])
      },
    )
    expect(snapshot.tickets).toHaveLength(1)
    expect(snapshot.tickets[0].title).toContain('handoff')
    expect(snapshot.tickets[0].runtime).toBe('cursor')
    expect(getBoard('Ebbe-Method', 'kitchen-board')?.tickets).toHaveLength(1)
  })
})

describe('getOrRefreshBoard', () => {
  it('returns a populated cache without hitting GitHub', async () => {
    putBoard({
      owner: 'acme',
      repo: 'cached',
      tickets: [
        {
          id: '1',
          number: 1,
          kind: 'issue',
          title: 'Already plated',
          url: 'https://github.com/acme/cached/issues/1',
          openedAt: '2026-09-09T12:00:00.000Z',
          size: 'S',
          labels: [],
          events: [],
          ci: 'none',
          hasLinkedPr: false,
          commentCount: 0,
          runtime: 'unknown',
        },
      ],
      generatedAt: '2026-09-09T12:00:00.000Z',
    })
    const http = vi.fn()
    const board = await getOrRefreshBoard('acme', 'cached', {
      env: {},
      http,
    })
    expect(board?.tickets[0].title).toBe('Already plated')
    expect(http).not.toHaveBeenCalled()
  })

  it('refreshes an empty cache when a token is in env', async () => {
    putBoard({
      owner: 'acme',
      repo: 'empty-pass',
      tickets: [],
      generatedAt: '2026-09-09T12:00:00.000Z',
    })
    const board = await getOrRefreshBoard('acme', 'empty-pass', {
      env: { GITHUB_TOKEN: 'pat' },
      http: async () =>
        Response.json([
          {
            id: 3,
            number: 3,
            title: 'From GitHub',
            html_url: 'https://github.com/acme/empty-pass/issues/3',
            created_at: '2026-09-09T12:00:00.000Z',
            labels: [],
            comments: 0,
          },
        ]),
    })
    expect(board?.tickets).toHaveLength(1)
    expect(board?.tickets[0].title).toBe('From GitHub')
  })
})
