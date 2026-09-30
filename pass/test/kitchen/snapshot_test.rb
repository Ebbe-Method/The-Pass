require "test_helper"

class SnapshotTest < ActiveSupport::TestCase
  test "keeps one board per owner and repo and replaces its tickets" do
    board = Board.create!(owner: "acme", repo: "widgets")
    board.tickets.create!(ticket_attrs(number: 1, title: "Old"))

    Kitchen::Snapshot.replace!(owner: "Acme", repo: "Widgets", issues: [
      issue(number: 7, title: "Moved", created_at: "2026-09-09T12:00:00Z", updated_at: "2026-09-09T13:00:00Z"),
      issue(number: 8, title: "Born still", created_at: "2026-09-09T12:00:00Z", updated_at: "2026-09-09T12:00:00Z")
    ])

    assert_equal 1, Board.where(owner: "acme", repo: "widgets").count
    stored = Board.find_for("acme", "widgets")
    assert_equal [ 7, 8 ], stored.tickets.order(:number).pluck(:number)
    moved = stored.tickets.find_by!(number: 7)
    assert_equal "none", moved.ci
    assert_equal 1, moved.progress_events.count
    assert_equal Time.iso8601("2026-09-09T13:00:00Z"), moved.progress_events.first.occurred_at
    assert_equal "label", moved.progress_events.first.kind
    assert_empty stored.tickets.find_by!(number: 8).progress_events
  end

  test "rolls back the previous tickets when replace fails" do
    board = Board.create!(owner: "acme", repo: "widgets")
    board.tickets.create!(ticket_attrs(number: 1, title: "Keep me"))

    assert_raises(ActiveRecord::RecordInvalid) do
      Kitchen::Snapshot.replace!(owner: "acme", repo: "widgets", issues: [
        issue(number: 2, title: ""),
        issue(number: 3, title: "Later")
      ])
    end

    assert_equal [ "Keep me" ], board.tickets.reload.map(&:title)
  end

  test "refresh stores the GitHub list and falls back is the caller's job" do
    key = OpenSSL::PKey::RSA.generate(2048)
    creds = Kitchen::Credentials::Github.new(
      app_id: "12345",
      private_key: key.to_pem,
      webhook_secret: "hook",
      installation_id: "77"
    )
    http = RecordingHttp.new do |call|
      if call[:url].include?("access_tokens")
        Kitchen::Http::Response.new(200, { "token" => "ghs_test" })
      else
        Kitchen::Http::Response.new(200, [
          issue(number: 4, title: "From GitHub", created_at: "2026-09-09T12:00:00Z", updated_at: "2026-09-09T15:00:00Z")
        ])
      end
    end

    board = Kitchen::Refresh.call(owner: "fuseon-connections", repo: "fuse-on-v2", credentials: creds, http: http)

    assert_equal "From GitHub", board.tickets.sole.title
    assert_equal "none", board.tickets.sole.ci
    assert_equal 1, board.tickets.sole.progress_events.count
    assert http.calls.none? { |call| call[:url].include?("check") }
  end

  private

  def issue(number:, title:, created_at: "2026-09-09T12:00:00Z", updated_at: "2026-09-09T12:00:00Z")
    {
      "id" => number,
      "number" => number,
      "title" => title,
      "html_url" => "https://github.com/acme/widgets/issues/#{number}",
      "created_at" => created_at,
      "updated_at" => updated_at,
      "labels" => [ { "name" => "size:M" } ],
      "comments" => 0
    }
  end

  def ticket_attrs(number:, title:)
    {
      github_id: number.to_s,
      number: number,
      kind: "issue",
      title: title,
      url: "https://github.com/acme/widgets/issues/#{number}",
      opened_at: Time.iso8601("2026-09-09T12:00:00Z"),
      size: "M",
      labels: [],
      ci: "none",
      has_linked_pr: false,
      comment_count: 0,
      runtime: "unknown"
    }
  end
end
