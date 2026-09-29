module Kitchen
  Presented = Struct.new(
    :ticket, :state, :heat, :wait_ms, :fresh_ms, :remaining_ms, :actors,
    keyword_init: true
  )

  module Present
    HEAT_RANK = { "hot" => 0, "warm" => 1, "cool" => 2 }.freeze
    RUNTIMES = %w[cursor claude copilot human bot unknown].freeze

    def self.call(ticket, now)
      Presented.new(
        ticket: ticket,
        state: Freshness.state_for(ticket, now),
        heat: Freshness.heat_for(ticket, now),
        wait_ms: [ 0, TimeMs.of(now) - TimeMs.of(ticket.opened_at) ].max,
        fresh_ms: Freshness.freshness_ms(ticket, now),
        remaining_ms: Freshness.remaining_to_stale_ms(ticket, now),
        actors: actors_on(ticket)
      )
    end

    def self.sort(rows)
      rows.sort_by { |row| [ HEAT_RANK.fetch(row.heat), row.remaining_ms, row.ticket.number ] }
    end

    def self.actors_on(ticket)
      seen = []
      push = lambda do |actor|
        return if actor.nil? || actor.to_s == "unknown" || seen.include?(actor.to_s)

        seen << actor.to_s
      end
      runtime = ticket.respond_to?(:runtime) ? ticket.runtime : nil
      seen << runtime.to_s if runtime.present? && runtime.to_s != ""
      Array(ticket.events).each { |event| push.call(event.actor) }
      seen.reject { |actor| actor == "unknown" }.presence || (runtime.to_s == "unknown" ? [ "unknown" ] : seen)
    end
  end
end
