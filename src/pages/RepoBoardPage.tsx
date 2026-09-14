import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Kiosk } from '@/components/Kiosk'
import type { Ticket } from '@/kiosk/types'

export function RepoBoardPage() {
  const { owner = 'demo', repo = 'kitchen' } = useParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetch(`/api/board/${owner}/${repo}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('no board')
          return res.json() as Promise<{ tickets: Ticket[] }>
        })
        .then((body) => {
          if (cancelled) return
          setTickets(body.tickets ?? [])
          setDemo(false)
        })
        .catch(() => {
          if (cancelled) return
          setDemo(false)
        })
    }
    load()
    const id = window.setInterval(load, 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [owner, repo])

  return <Kiosk tickets={tickets} owner={owner} repo={repo} demo={demo} />
}
