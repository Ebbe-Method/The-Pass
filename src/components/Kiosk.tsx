import { useEffect, useMemo, useState } from 'react'
import { ActorChip } from '@/components/ActorChip'
import { Rail } from '@/components/Rail'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import type { Distance, LayoutId, Ticket } from '@/kiosk/types'
import { presentTicket, sortPresented, visibleTickets } from '@/lib/present'
import type { PresentedTicket } from '@/lib/present'
import { cn } from '@/lib/utils'

export function Kiosk({
  tickets,
  owner,
  repo,
  demo = false,
}: {
  tickets: Ticket[]
  owner: string
  repo: string
  demo?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())
  const [mountedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [layout, setLayout] = useState<LayoutId>(readLayout)
  const [distance, setDistance] = useState<Distance>(readDistance)
  const [open, setOpen] = useState<PresentedTicket | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      setElapsed(t - mountedAt)
    }, 1000)
    return () => window.clearInterval(id)
  }, [mountedAt])

  useEffect(() => {
    document.documentElement.dataset.distance = distance
  }, [distance])

  const rows = useMemo(() => {
    const visible = visibleTickets(tickets, elapsed)
    return sortPresented(visible.map((ticket) => presentTicket(ticket, now)))
  }, [tickets, elapsed, now])

  const hotCount = rows.filter((r) => r.heat === 'hot').length

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <p className="font-clock text-[11px] tracking-[0.28em] text-lamp uppercase">
            The Pass
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Your agents are cooking.
          </h1>
          <p className="mt-1 text-sm text-paper/60">
            Don&apos;t let tickets go cold.{' '}
            <span className="font-clock text-paper/40">
              {owner}/{repo}
            </span>
            {demo && (
              <span className="ml-2 text-lamp/80">Demo · no GitHub login</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-clock text-4xl tabular-nums text-heat">
            {String(hotCount).padStart(2, '0')}
          </p>
          <p className="text-[11px] tracking-[0.18em] text-paper/45 uppercase">
            hot on the pass
          </p>
        </div>
      </header>

      <main className="pass-frame mx-4 mb-4 flex-1 rounded-md bg-steel-2/80 p-5">
        <Rail
          rows={rows}
          layout={layout}
          onOpen={(row) => setOpen(row)}
        />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 text-[11px] text-paper/40">
        <nav className="flex gap-2">
          {(['expo', 'pits', 'stations'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={cn(
                'rounded-full px-3 py-1 tracking-[0.16em] uppercase',
                layout === id ? 'bg-white/10 text-paper' : 'hover:text-paper',
              )}
              onClick={() => {
                setLayout(id)
                const url = new URL(window.location.href)
                url.searchParams.set('layout', id)
                window.history.replaceState({}, '', url)
              }}
            >
              {id}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="tracking-[0.16em] uppercase hover:text-paper"
            onClick={() =>
              setDistance((d) => {
                const next = d === '2ft' ? '10ft' : '2ft'
                const url = new URL(window.location.href)
                url.searchParams.set('distance', next)
                window.history.replaceState({}, '', url)
                return next
              })
            }
          >
            {distance}
          </button>
          <a className="hover:text-lamp" href="/design">
            Design
          </a>
          <a className="hover:text-lamp" href="/install">
            Put it on a repo
          </a>
        </div>
      </footer>

      {open && (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) setOpen(null)
          }}
          trigger={undefined}
          title={`#${open.ticket.number} ${open.ticket.title}`}
        >
          <div className="flex flex-col gap-4 text-sm text-paper/80">
            <p>
              {open.state === 'waiting_on_you'
                ? 'Waiting on you. Jump in.'
                : open.state === 'stale'
                  ? 'This ticket went quiet. Unstick it.'
                  : 'Still moving.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {open.actors.map((runtime) => (
                <ActorChip key={runtime} runtime={runtime} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className={buttonVariants()}
                href={open.ticket.url}
                target="_blank"
                rel="noreferrer"
              >
                Open GitHub
              </a>
              {open.ticket.sessionUrl ? (
                <a
                  className={buttonVariants({ variant: 'paper' })}
                  href={open.ticket.sessionUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open session
                </a>
              ) : (
                <Button variant="ghost" disabled>
                  No session URL
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function readLayout(): LayoutId {
  const value = new URLSearchParams(window.location.search).get('layout')
  if (value === 'pits' || value === 'stations' || value === 'expo') return value
  return 'expo'
}

function readDistance(): Distance {
  const value = new URLSearchParams(window.location.search).get('distance')
  return value === '10ft' ? '10ft' : '2ft'
}
