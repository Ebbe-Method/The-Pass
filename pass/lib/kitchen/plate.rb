module Kitchen
  class Plate
    attr_accessor :id, :number, :kind, :title, :url, :opened_at, :size, :labels,
                  :events, :ci, :has_linked_pr, :comment_count, :runtime, :session_url,
                  :arrive_after_ms

    def initialize(attrs = {})
      @labels = []
      @events = []
      @ci = "none"
      @has_linked_pr = false
      @comment_count = 0
      @runtime = "unknown"
      attrs.each { |key, value| public_send("#{key}=", value) }
    end
  end
end
