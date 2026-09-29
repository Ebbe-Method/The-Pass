import { Controller } from "@hotwired/stimulus"

const STALE = { S: 45 * 60 * 1000, M: 2 * 60 * 60 * 1000, L: 4 * 60 * 60 * 1000, XL: 8 * 60 * 60 * 1000 }
const WAITING_HOT = 20 * 60 * 1000
const ABANDONED = 2 * 60 * 60 * 1000
const MARKS = {
  queued: "○ queued",
  cooking: "◌ cooking",
  waiting_on_you: "● waiting on you",
  stale: "▲ stale"
}

export default class extends Controller {
  connect() {
    this.started = Date.now()
    this.tick()
    this.timer = window.setInterval(() => this.tick(), 1000)
  }

  disconnect() {
    window.clearInterval(this.timer)
  }

  tick() {
    const now = Date.now()
    this.element.querySelectorAll("[data-clock]").forEach((ticket) => this.update(ticket, now))
  }

  update(ticket, now) {
    const arrive = Number(ticket.dataset.arriveAfter || 0)
    if (arrive > 0 && now - this.started < arrive) {
      ticket.hidden = true
      return
    }
    ticket.hidden = false

    const fresh = Math.max(0, now - Date.parse(ticket.dataset.progressAt))
    const opened = Math.max(0, now - Date.parse(ticket.dataset.openedAt))
    const state = this.state(ticket, fresh)
    const heat = this.heat(ticket, state, fresh)
    ticket.dataset.heat = heat
    ticket.dataset.state = state
    const mark = ticket.querySelector("[data-clock-mark]")
    if (mark) mark.textContent = MARKS[state]
    const walk = ticket.querySelector("[data-clock-walk]")
    const budget = STALE[ticket.dataset.size] || STALE.M
    if (walk) walk.textContent = this.countdown(Math.max(0, budget - fresh))
    const open = ticket.querySelector("[data-clock-open]")
    if (open) open.textContent = this.clock(opened)
  }

  state(ticket, fresh) {
    const labels = this.labels(ticket)
    if (labels.includes("status:needs-rob") || (ticket.dataset.kind === "pr" && ticket.dataset.ci === "green")) {
      return "waiting_on_you"
    }
    const comments = Number(ticket.dataset.comments || 0)
    const linked = ticket.dataset.linked === "true"
    if (labels.includes("status:in-flight") && comments === 0 && !linked && fresh >= ABANDONED) return "stale"
    const cooking = labels.includes("status:in-flight") || ticket.dataset.kind === "pr"
    if (!cooking) return "queued"
    return fresh >= (STALE[ticket.dataset.size] || STALE.M) ? "stale" : "cooking"
  }

  heat(ticket, state, fresh) {
    if (state === "stale") return "hot"
    if (state === "waiting_on_you") return fresh >= WAITING_HOT ? "hot" : "warm"
    if (state === "cooking") {
      const budget = STALE[ticket.dataset.size] || STALE.M
      return fresh / budget >= 0.5 ? "warm" : "cool"
    }
    return "cool"
  }

  labels(ticket) {
    try {
      return JSON.parse(ticket.dataset.labels || "[]")
    } catch {
      return []
    }
  }

  countdown(ms) {
    if (ms <= 0) return "late"
    return this.clock(ms).replace("just in", "<1m")
  }

  clock(ms) {
    const total = Math.floor(ms / 60000)
    if (total < 1) return "just in"
    if (total < 60) return `${total}m`
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    if (hours < 24) return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
    const days = Math.floor(hours / 24)
    const rem = hours % 24
    return rem === 0 ? `${days}d` : `${days}d ${rem}h`
  }
}
