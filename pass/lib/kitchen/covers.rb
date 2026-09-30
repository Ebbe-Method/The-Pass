module Kitchen
  module Covers
    TABLE = { "S" => 1, "M" => 2, "L" => 4, "XL" => 8 }.freeze
    HUMAN_CAP = 8
    AGENT_CAP = 24

    def self.for(size)
      TABLE.fetch(size.to_s)
    end
  end
end
