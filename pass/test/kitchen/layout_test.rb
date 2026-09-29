require "test_helper"

class LayoutTest < ActiveSupport::TestCase
  T0 = Time.iso8601("2026-09-09T12:10:00.000Z")
  T0_MS = (T0.to_r * 1000).round

  test "keeps waiting and stale on expo even when the human meter is slammed" do
    rows = [
      row(id: "a", number: 1, size: "XL", labels: [ "status:needs-rob" ]),
      row(id: "b", number: 2, size: "XL", labels: [ "status:needs-rob" ]),
      row(
        id: "stale",
        number: 3,
        size: "M",
        opened_at: "2026-09-09T09:00:00.000Z",
        labels: [ "status:in-flight" ],
        comment_count: 0,
        has_linked_pr: false
      )
    ]
    pass = Kitchen::Layout.call(rows)
    assert_equal [ "stale", "a", "b" ], pass.expo.map { |presented| presented.ticket.id }
    assert_equal 8 + 8 + 2, pass.human_covers
    assert_equal Kitchen::Covers::HUMAN_CAP, pass.human_cap
    assert pass.human_slammed
    assert_equal 3, pass.expo.length
  end

  test "paints cooking until 24 covers and counts overflow in the well and on the agent meter" do
    cooking = Array.new(4) do |index|
      row(
        id: "xl-#{index}",
        number: index + 10,
        size: "XL",
        labels: [ "status:in-flight" ],
        comment_count: 2,
        has_linked_pr: true
      )
    end
    queued = row(id: "q", number: 99, size: "S", labels: [])
    pass = Kitchen::Layout.call(cooking + [ queued ])
    assert_equal 3, pass.line.length
    assert pass.line.all? { |presented| presented.state == "cooking" }
    assert_equal 2, pass.well_count
    assert_equal 32, pass.agent_covers
    assert_equal Kitchen::Covers::AGENT_CAP, pass.agent_cap
    assert pass.agent_slammed
    assert_nil pass.line.find { |presented| presented.ticket.id == queued.ticket.id }
    assert_empty pass.expo
  end

  test "skips a plate that does not fit and still fills with a later smaller one" do
    tens = Array.new(10) do |index|
      cooking(id: "m-#{index}", number: index + 1, size: "M", at: "2026-09-09T10:20:00.000Z")
    end
    banquet = cooking(id: "banquet", number: 50, size: "XL", at: "2026-09-09T04:30:00.000Z")
    side = cooking(id: "side", number: 51, size: "S", at: "2026-09-09T11:55:00.000Z")
    pass = Kitchen::Layout.call([ banquet, side, *tens ])
    ids = pass.line.map { |presented| presented.ticket.id }
    assert_includes ids, "side"
    assert_not_includes ids, "banquet"
    assert_equal 1, pass.well_count
    assert_equal 20 + 8 + 1, pass.agent_covers
    assert pass.agent_slammed
  end

  test "is not slammed at exactly the cap" do
    pass = Kitchen::Layout.call([
      row(id: "xl", number: 1, size: "XL", labels: [ "status:needs-rob" ])
    ])
    assert_equal 8, pass.human_covers
    assert_not pass.human_slammed
  end

  private

  def row(overrides)
    Kitchen::Present.call(plate(overrides), T0_MS)
  end

  def cooking(overrides)
    at = overrides.delete(:at)
    row(
      {
        labels: [ "status:in-flight" ],
        comment_count: 2,
        has_linked_pr: true,
        events: [
          Kitchen::Event.new(kind: "commit", at: at, actor: "cursor", label: "commit")
        ]
      }.merge(overrides)
    )
  end

  def plate(overrides)
    Kitchen::Plate.new(
      {
        id: "1",
        number: 1,
        kind: "issue",
        title: "x",
        url: "https://example.com",
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
