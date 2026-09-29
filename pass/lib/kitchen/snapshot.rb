module Kitchen
  module Snapshot
    def self.replace!(owner:, repo:, issues:)
      Board.transaction do
        board = Board.find_or_create_for!(owner, repo)
        built = issues.map { |issue| attributes_for(owner, repo, issue) }
        board.tickets.destroy_all
        built.each do |attrs, movement|
          ticket = board.tickets.create!(attrs)
          next unless movement

          ticket.progress_events.create!(movement)
        end
        board.reload
      end
    end

    def self.attributes_for(owner, repo, issue)
      plate = Github.ticket_from_issue(owner, repo, issue)
      attrs = {
        github_id: plate.id,
        number: plate.number,
        kind: plate.kind,
        title: plate.title,
        url: plate.url,
        opened_at: time_for(plate.opened_at),
        size: plate.size,
        labels: plate.labels,
        ci: "none",
        has_linked_pr: plate.has_linked_pr,
        comment_count: plate.comment_count,
        runtime: plate.runtime.presence || "unknown",
        session_url: plate.session_url
      }
      movement = nil
      if Github.moved?(issue)
        movement = {
          kind: "label",
          occurred_at: Time.iso8601(issue["updated_at"].to_s),
          actor: "unknown",
          label: "updated",
          bot: false
        }
      end
      [ attrs, movement ]
    end

    def self.time_for(value)
      return value if value.is_a?(Time)

      Time.iso8601(value.to_s)
    end
  end
end
