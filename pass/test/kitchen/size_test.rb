require "test_helper"

class SizeTest < ActiveSupport::TestCase
  test "reads size:S through size:XL" do
    assert_equal "S", Kitchen::Size.from_labels([ "ready-for-agent", "size:S" ])
    assert_equal "XL", Kitchen::Size.from_labels([ "size:XL" ])
  end

  test "returns nil when the size label is missing" do
    assert_nil Kitchen::Size.from_labels([ "status:in-flight" ])
  end

  test "treats epic or a milestone as XL" do
    assert_equal "XL", Kitchen::Size.infer(kind: "issue", labels: [ "epic" ], body: "short")
    assert_equal "XL", Kitchen::Size.infer(
      kind: "pr",
      labels: [],
      body: "tiny",
      milestone: { "title" => "Launch" }
    )
  end

  test "treats a short unlabeled PR as S" do
    assert_equal "S", Kitchen::Size.infer(kind: "pr", labels: [], body: "please review")
  end

  test "treats a long unlabeled body as L" do
    assert_equal "L", Kitchen::Size.infer(kind: "issue", labels: [], body: "x" * 1500)
  end

  test "defaults everything else to M" do
    assert_equal "M", Kitchen::Size.infer(kind: "issue", labels: [], body: "hi")
  end

  test "lets a size label win over epic and body length" do
    assert_equal "S", Kitchen::Size.for_ticket(
      kind: "pr",
      labels: [ "size:S", "epic" ],
      body: "x" * 2000,
      milestone: { "title" => "Launch" }
    )
  end

  test "prints at most one status and prefers needs-rob" do
    assert_equal "in-flight", Kitchen::Size.kitchen_chip([ "status:in-flight" ])
    assert_equal "needs-rob", Kitchen::Size.kitchen_chip([ "status:needs-rob", "status:in-flight" ])
    assert_nil Kitchen::Size.kitchen_chip([ "ready-for-agent" ])
  end
end
