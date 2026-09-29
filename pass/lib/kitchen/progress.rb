module Kitchen
  module Progress
    KINDS = %w[commit review ci comment label].freeze

    def self.progress?(event)
      return false if event.bot && event.kind.to_s == "comment"

      KINDS.include?(event.kind.to_s)
    end

    def self.last_at(ticket)
      real = Array(ticket.events).select { |event| progress?(event) }
      return ticket.opened_at if real.empty?

      real.max_by { |event| TimeMs.of(event.at) }.at
    end
  end
end
