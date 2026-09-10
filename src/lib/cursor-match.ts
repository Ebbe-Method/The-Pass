export type CursorAgent = {
  bcId: string
  branchName: string
  name: string
  status: 'RUNNING' | 'IDLE'
}

export type TicketRef = {
  number: number
  title: string
}

export function matchCursorAgent(agent: CursorAgent, ticket: TicketRef): boolean {
  const n = String(ticket.number)
  const isolated = new RegExp(`(^|[^0-9])${n}([^0-9]|$)`)
  if (isolated.test(agent.branchName)) return true
  if (agent.name.includes(`#${n}`)) return true
  return false
}

export function sessionUrlFor(bcId: string): string {
  return `https://cursor.com/agents/${bcId}`
}
