module Kitchen
  module Freshness
    STATE_LABEL = {
      "queued" => "queued",
      "cooking" => "cooking",
      "waiting_on_you" => "waiting on you",
      "stale" => "stale"
    }.freeze

    def self.freshness_ms(ticket, now)
      [ 0, TimeMs.of(now) - TimeMs.of(Progress.last_at(ticket)) ].max
    end

    def self.remaining_to_stale_ms(ticket, now)
      [ 0, STALE_MS.fetch(ticket.size.to_s) - freshness_ms(ticket, now) ].max
    end

    def self.state_for(ticket, now)
      return "waiting_on_you" if waiting_on_you?(ticket)
      return "stale" if abandoned_claim?(ticket, now)
      if cooking?(ticket)
        return "stale" if freshness_ms(ticket, now) >= STALE_MS.fetch(ticket.size.to_s)

        return "cooking"
      end

      "queued"
    end

    def self.heat_for(ticket, now)
      state = state_for(ticket, now)
      return "hot" if state == "stale"
      if state == "waiting_on_you"
        return freshness_ms(ticket, now) >= WAITING_HOT_MS ? "hot" : "warm"
      end
      if state == "cooking"
        ratio = freshness_ms(ticket, now).to_f / STALE_MS.fetch(ticket.size.to_s)
        return ratio >= 0.5 ? "warm" : "cool"
      end

      "cool"
    end

    def self.waiting_on_you?(ticket)
      return true if Array(ticket.labels).include?("status:needs-rob")

      ticket.kind.to_s == "pr" && ticket.ci.to_s == "green"
    end

    def self.cooking?(ticket)
      return true if Array(ticket.labels).include?("status:in-flight")

      ticket.kind.to_s == "pr"
    end

    def self.abandoned_claim?(ticket, now)
      return false unless Array(ticket.labels).include?("status:in-flight")
      return false if ticket.comment_count.to_i.positive?
      return false if ticket.has_linked_pr

      freshness_ms(ticket, now) >= ABANDONED_MS
    end
  end
end
