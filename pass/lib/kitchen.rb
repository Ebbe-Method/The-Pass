module Kitchen
  STALE_MS = {
    "S" => 45 * 60 * 1000,
    "M" => 2 * 60 * 60 * 1000,
    "L" => 4 * 60 * 60 * 1000,
    "XL" => 8 * 60 * 60 * 1000
  }.freeze
  WAITING_HOT_MS = 20 * 60 * 1000
  ABANDONED_MS = 2 * 60 * 60 * 1000

  module TimeMs
    def self.of(value)
      case value
      when Integer
        value
      when Time
        (value.to_r * 1000).round
      else
        (Time.iso8601(value.to_s).to_r * 1000).round
      end
    end

    def self.iso(value)
      case value
      when Time
        value.utc.iso8601(3)
      when Integer
        Time.at(value / 1000.0).utc.iso8601(3)
      else
        Time.iso8601(value.to_s).utc.iso8601(3)
      end
    end
  end
end
