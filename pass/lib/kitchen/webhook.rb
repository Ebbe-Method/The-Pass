module Kitchen
  module Webhook
    def self.apply!(owner:, repo:, event:, payload:)
      issue = payload["issue"] || payload["pull_request"]
      board = Board.find_or_create_for!(owner, repo)
      return board unless issue.is_a?(Hash) && issue["number"]

      Board.transaction do
        if payload["action"] == "closed"
          board.tickets.where(number: issue["number"]).destroy_all
        else
        source = issue.dup
        source["pull_request"] ||= payload["pull_request"] if payload["pull_request"]
        plate = Github.ticket_from_issue(owner, repo, source)
        ticket = board.tickets.find_or_initialize_by(number: plate.number)
        prior_size = ticket.size
        labeled_size = Size.from_labels(Github.label_names(issue["labels"]))
        ticket.assign_attributes(
          github_id: plate.id,
          kind: plate.kind,
          title: plate.title.presence || ticket.title || "Untitled",
          url: plate.url,
          opened_at: issue["created_at"].present? ? Snapshot.time_for(issue["created_at"]) : (ticket.opened_at || Time.now.utc),
          size: labeled_size || (ticket.persisted? ? prior_size : plate.size),
          labels: Github.label_names(issue["labels"]),
          ci: "none",
          has_linked_pr: ticket.has_linked_pr || plate.has_linked_pr,
          comment_count: issue.fetch("comments", ticket.comment_count).to_i,
          runtime: ticket.runtime.presence || plate.runtime.presence || "unknown",
          session_url: ticket.session_url
        )
        Github.apply_claim(ticket, html_from(payload))
        ticket.save!

        classified = classify(event, payload)
        if classified
          ticket.progress_events.create!(
            kind: classified[:kind],
            occurred_at: Time.now.utc,
            actor: classified[:bot] ? "bot" : "human",
            label: classified[:label],
            bot: classified[:bot]
          )
        end
        end
      end
      board.reload
    end

    def self.html_from(payload)
      payload.dig("comment", "body") || payload.dig("issue", "body") || payload.dig("pull_request", "body")
    end

    def self.classify(event, payload)
      action = payload["action"]
      return nil if event == "projects_v2_item"
      return nil if event == "issues" && action == "edited"

      if event == "push"
        commits = payload["commits"]
        return { kind: "commit", label: "commit", bot: false } if commits.is_a?(Array) && commits.any?

        return nil
      end

      return { kind: "review", label: "review submitted", bot: false } if event == "pull_request_review" && action == "submitted"

      if event == "check_run" && action == "completed"
        return { kind: "ci", label: "CI #{payload.dig("check_run", "conclusion") || "done"}", bot: false }
      end

      if event == "workflow_run" && action == "completed"
        return { kind: "ci", label: "CI #{payload.dig("workflow_run", "conclusion") || "done"}", bot: false }
      end

      if event == "issue_comment" && action == "created"
        bot = payload.dig("comment", "user", "type") == "Bot"
        return { kind: "comment", label: "comment", bot: bot }
      end

      if (event == "issues" || event == "pull_request") && action == "labeled"
        return { kind: "label", label: payload.dig("label", "name") || "label", bot: false }
      end

      nil
    end
  end
end
