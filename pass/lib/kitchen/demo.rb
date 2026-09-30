module Kitchen
  module Demo
    def self.tickets(now = Time.now)
      ago = ->(ms) { now - (ms / 1000.0) }
      [
        plate(
          id: "needs-rob", number: 3064, kind: "pr", size: "L",
          title: "Merge-queue attestation for user-visible work",
          url: "https://github.com/fuseon-connections/fuse-on-v2/pull/3064",
          opened_at: ago.call(3 * 60 * 60 * 1000),
          labels: [ "status:needs-rob" ],
          events: [ event("ci", ago.call(25 * 60 * 1000), "bot", "CI green") ],
          ci: "green", has_linked_pr: true, comment_count: 4, runtime: "human"
        ),
        plate(
          id: "abandoned", number: 1321, kind: "issue", size: "M",
          title: "Evening open-loops mutex never posted the claim",
          url: "https://github.com/fuseon-connections/fuse-on-v2/issues/1321",
          opened_at: ago.call(6 * 60 * 60 * 1000),
          labels: [ "status:in-flight" ],
          ci: "none", has_linked_pr: false, comment_count: 0, runtime: "unknown"
        ),
        plate(
          id: "cursor-live", number: 3840, kind: "issue", size: "S",
          title: "Kitchen claim heartbeat on SessionStart",
          url: "https://github.com/fuseon-connections/fuse-on-v2/issues/3840",
          opened_at: ago.call(80 * 60 * 1000),
          labels: [ "status:in-flight" ],
          events: [ event("commit", ago.call(11 * 60 * 1000), "cursor", "commit") ],
          session_url: "https://cursor.com/agents/bc-76e61dea-89a3-4cef-9950-a65f31d38ce8",
          runtime: "cursor", ci: "pending", has_linked_pr: true, comment_count: 2
        ),
        plate(
          id: "claude-cook", number: 2711, kind: "pr", size: "L",
          title: "Size-aware stale thresholds for tracker hygiene",
          url: "https://github.com/fuseon-connections/fuse-on-v2/pull/2711",
          opened_at: ago.call(5 * 60 * 60 * 1000),
          labels: [ "status:in-flight" ],
          events: [ event("comment", ago.call(70 * 60 * 1000), "claude", "comment") ],
          runtime: "claude", ci: "pending", has_linked_pr: true, comment_count: 6
        ),
        plate(
          id: "queued", number: 4012, kind: "issue", size: "S",
          title: "Document the heartbeat snippet for consumer repos",
          url: "https://github.com/fuseon-connections/fuse-on-v2/issues/4012",
          opened_at: ago.call(40 * 60 * 1000),
          labels: [ "ready-for-agent" ],
          runtime: "unknown", ci: "none", has_linked_pr: false, comment_count: 0
        ),
        plate(
          id: "copilot-review", number: 3550, kind: "pr", size: "M",
          title: "Actor chips when GitHub authors collapse to one login",
          url: "https://github.com/fuseon-connections/fuse-on-v2/pull/3550",
          opened_at: ago.call(9 * 60 * 60 * 1000),
          labels: [ "status:in-flight" ],
          events: [
            event("review", ago.call(18 * 60 * 1000), "human", "review submitted"),
            event("commit", ago.call(2 * 60 * 60 * 1000), "copilot", "commit")
          ],
          runtime: "copilot", ci: "green", has_linked_pr: true, comment_count: 3
        ),
        plate(
          id: "magic-tear", number: 4099, kind: "issue", size: "S",
          title: "Unstick the waiting-on-you rail before dinner",
          url: "https://github.com/fuseon-connections/fuse-on-v2/issues/4099",
          opened_at: ago.call(22 * 60 * 1000),
          labels: [ "status:needs-rob" ],
          events: [ event("label", ago.call(22 * 60 * 1000), "bot", "status:needs-rob") ],
          runtime: "human", ci: "none", has_linked_pr: false, comment_count: 1,
          arrive_after_ms: 8000
        )
      ]
    end

    def self.plate(attrs)
      Plate.new(attrs)
    end

    def self.event(kind, at, actor, label)
      Event.new(kind: kind, at: at, actor: actor, label: label, bot: false)
    end
  end
end
