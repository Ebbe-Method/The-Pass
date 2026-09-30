module WallsHelper
  MARKS = {
    "queued" => "○ queued",
    "cooking" => "◌ cooking",
    "waiting_on_you" => "● waiting on you",
    "stale" => "▲ stale"
  }.freeze

  def state_mark(state)
    MARKS.fetch(state, Kitchen::Freshness::STATE_LABEL[state] || state)
  end

  def tilt_for(id)
    total = id.to_s.each_char.sum(&:ord) % 11
    "#{((total - 5) * 0.18).round(2)}deg"
  end

  def clock_iso(value)
    Kitchen::TimeMs.iso(value)
  end

  def actor_names(ticket)
    names = []
    runtime = ticket.runtime.to_s
    names << runtime if runtime.present?
    Array(ticket.events).each do |event|
      actor = event.actor.to_s
      names << actor if actor.present? && actor != "unknown"
    end
    names = names.uniq
    visible = names.reject { |name| name == "unknown" }
    visible.presence || [ "unknown" ]
  end

  def layout_path(layout)
    url_for(request.query_parameters.merge(layout: layout, distance: @distance))
  end
end
