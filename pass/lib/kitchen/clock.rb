module Kitchen
  module Clock
    def self.countdown(ms)
      return "late" if ms <= 0

      format(ms).sub("just in", "<1m")
    end

    def self.open_for(ms)
      format(ms)
    end

    def self.format(ms)
      total = ms.to_i / 60_000
      return "just in" if total < 1
      return "#{total}m" if total < 60

      hours = total / 60
      minutes = total % 60
      if hours < 24
        return "#{hours}h" if minutes.zero?

        return "#{hours}h #{minutes}m"
      end

      days = hours / 24
      rem = hours % 24
      return "#{days}d" if rem.zero?

      "#{days}d #{rem}h"
    end
  end
end
