module Kitchen
  module Size
    SHORT_PR_BODY_CHARS = 400
    LONG_BODY_CHARS = 1500

    def self.from_labels(labels)
      labels.each do |label|
        match = /\Asize:(S|M|L|XL)\z/i.match(label.to_s)
        return match[1].upcase if match
      end
      nil
    end

    def self.infer(kind:, labels:, body: nil, milestone: nil)
      return "XL" if labels.any? { |label| label.to_s.downcase == "epic" } || !milestone.nil?

      body_len = body.to_s.length
      return "S" if kind.to_s == "pr" && body_len < SHORT_PR_BODY_CHARS
      return "L" if body_len >= LONG_BODY_CHARS

      "M"
    end

    def self.for_ticket(kind:, labels:, body: nil, milestone: nil)
      from_labels(labels) || infer(kind: kind, labels: labels, body: body, milestone: milestone)
    end

    def self.kitchen_chip(labels)
      names = labels.map { |label| label.to_s.downcase }
      return "needs-rob" if names.include?("status:needs-rob")
      return "in-flight" if names.include?("status:in-flight")

      nil
    end
  end
end
