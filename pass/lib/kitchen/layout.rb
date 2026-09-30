module Kitchen
  module Layout
    def self.call(rows)
      expo = rows.select { |row| row.state == "waiting_on_you" || row.state == "stale" }.sort { |a, b| by_lamp(a, b) }
      cooking = rows.select { |row| row.state == "cooking" }.sort { |a, b| by_lamp(a, b) }
      queued = rows.select { |row| row.state == "queued" }

      line = []
      used = 0
      overflow = []
      cooking.each do |row|
        cost = Covers.for(row.ticket.size)
        if used + cost <= Covers::AGENT_CAP
          line << row
          used += cost
        else
          overflow << row
        end
      end

      human_covers = expo.sum { |row| Covers.for(row.ticket.size) }
      agent_covers = cooking.sum { |row| Covers.for(row.ticket.size) }

      Arrangement.new(
        expo: expo,
        line: line,
        well_count: queued.length + overflow.length,
        human_covers: human_covers,
        agent_covers: agent_covers,
        human_cap: Covers::HUMAN_CAP,
        agent_cap: Covers::AGENT_CAP,
        human_slammed: human_covers > Covers::HUMAN_CAP,
        agent_slammed: agent_covers > Covers::AGENT_CAP
      )
    end

    def self.by_lamp(left, right)
      heat = Present::HEAT_RANK.fetch(left.heat) - Present::HEAT_RANK.fetch(right.heat)
      return heat unless heat.zero?

      remain = left.remaining_ms - right.remaining_ms
      return remain unless remain.zero?

      left.ticket.number <=> right.ticket.number
    end
  end
end
