module Kitchen
  class Event
    attr_accessor :kind, :at, :actor, :label, :bot

    def initialize(kind:, at:, actor: "unknown", label: "", bot: false)
      @kind = kind
      @at = at
      @actor = actor
      @label = label
      @bot = bot
    end
  end
end
