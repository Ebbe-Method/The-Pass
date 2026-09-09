export function formatClock(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  if (totalMinutes < 1) return 'just in'
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) {
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  }
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`
}
