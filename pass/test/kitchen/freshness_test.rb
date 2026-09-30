require "test_helper"

class FreshnessTest < ActiveSupport::TestCase
  T0 = Time.iso8601("2026-09-09T12:00:00.000Z")
  T0_MS = (T0.to_r * 1000).round

  test "is elapsed time since last real progress" do
    plate = plate(
      events: [
        Kitchen::Event.new(kind: "commit", at: "2026-09-09T12:30:00.000Z", actor: "cursor", label: "push")
      ]
    )
    assert_equal 60 * 60 * 1000, Kitchen::Freshness.freshness_ms(plate, T0_MS + 90 * 60 * 1000)
  end

  test "maps ready-for-agent and unlabeled open issues to queued" do
    assert_equal "queued", Kitchen::Freshness.state_for(plate(labels: []), T0_MS)
    assert_equal "queued", Kitchen::Freshness.state_for(plate(labels: [ "ready-for-agent" ]), T0_MS)
  end

  test "maps in-flight or an open PR to cooking while fresh" do
    now = T0_MS + 10 * 60 * 1000
    assert_equal "cooking", Kitchen::Freshness.state_for(plate(labels: [ "status:in-flight" ]), now)
    assert_equal "cooking", Kitchen::Freshness.state_for(plate(kind: "pr", labels: [], ci: "pending"), now)
  end

  test "maps needs-rob or a green unarmed PR to waiting_on_you" do
    assert_equal "waiting_on_you", Kitchen::Freshness.state_for(
      plate(labels: [ "status:needs-rob" ]),
      T0_MS + 5 * 60 * 1000
    )
    assert_equal "waiting_on_you", Kitchen::Freshness.state_for(
      plate(kind: "pr", ci: "green", labels: []),
      T0_MS + 5 * 60 * 1000
    )
  end

  test "marks an in-flight issue with zero comments and no PR stale after 2h" do
    plate = plate(labels: [ "status:in-flight" ], comment_count: 0, has_linked_pr: false, events: [])
    assert_equal "stale", Kitchen::Freshness.state_for(plate, T0_MS + Kitchen::ABANDONED_MS)
    assert_equal "cooking", Kitchen::Freshness.state_for(plate, T0_MS + Kitchen::ABANDONED_MS - 1)
  end

  test "uses size-aware stale while cooking" do
    cooking = plate(
      size: "S",
      labels: [ "status:in-flight" ],
      comment_count: 3,
      has_linked_pr: true
    )
    assert_equal "stale", Kitchen::Freshness.state_for(cooking, T0_MS + Kitchen::STALE_MS["S"])

    large = plate(
      size: "XL",
      labels: [ "status:in-flight" ],
      comment_count: 3,
      has_linked_pr: true
    )
    assert_equal "cooking", Kitchen::Freshness.state_for(large, T0_MS + Kitchen::STALE_MS["S"])
  end

  test "keeps queued and fresh cooking cool" do
    assert_equal "cool", Kitchen::Freshness.heat_for(plate(labels: []), T0_MS + 60_000)
  end

  test "heats waiting_on_you after 20 minutes" do
    plate = plate(labels: [ "status:needs-rob" ])
    assert_equal "warm", Kitchen::Freshness.heat_for(plate, T0_MS + Kitchen::WAITING_HOT_MS - 1)
    assert_equal "hot", Kitchen::Freshness.heat_for(plate, T0_MS + Kitchen::WAITING_HOT_MS)
  end

  test "marks stale tickets hot" do
    plate = plate(labels: [ "status:in-flight" ], comment_count: 0, has_linked_pr: false)
    assert_equal "hot", Kitchen::Freshness.heat_for(plate, T0_MS + Kitchen::ABANDONED_MS)
  end

  test "counts down the size budget from last progress" do
    plate = plate(
      size: "S",
      labels: [ "status:in-flight" ],
      comment_count: 3,
      has_linked_pr: true
    )
    assert_equal 30 * 60 * 1000, Kitchen::Freshness.remaining_to_stale_ms(plate, T0_MS + 15 * 60 * 1000)
    assert_equal 0, Kitchen::Freshness.remaining_to_stale_ms(plate, T0_MS + Kitchen::STALE_MS["S"])
    assert_equal 0, Kitchen::Freshness.remaining_to_stale_ms(plate, T0_MS + Kitchen::STALE_MS["S"] + 60_000)
  end

  test "uses the XL budget when the plate is XL" do
    plate = plate(
      size: "XL",
      labels: [ "status:in-flight" ],
      comment_count: 3,
      has_linked_pr: true
    )
    assert_equal(
      Kitchen::STALE_MS["XL"] - Kitchen::STALE_MS["S"],
      Kitchen::Freshness.remaining_to_stale_ms(plate, T0_MS + Kitchen::STALE_MS["S"])
    )
  end

  private

  def plate(overrides = {})
    Kitchen::Plate.new(
      {
        id: "1",
        number: 1,
        kind: "issue",
        title: "Claim the pass",
        url: "https://github.com/example/repo/issues/1",
        opened_at: "2026-09-09T12:00:00.000Z",
        size: "M",
        labels: [],
        events: [],
        ci: "none",
        has_linked_pr: false,
        comment_count: 0
      }.merge(overrides)
    )
  end
end
