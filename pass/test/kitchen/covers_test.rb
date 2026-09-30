require "test_helper"

class CoversTest < ActiveSupport::TestCase
  test "weights S/M/L/XL as 1/2/4/8" do
    assert_equal({ "S" => 1, "M" => 2, "L" => 4, "XL" => 8 }, Kitchen::Covers::TABLE)
    assert_equal 1, Kitchen::Covers.for("S")
    assert_equal 2, Kitchen::Covers.for("M")
    assert_equal 4, Kitchen::Covers.for("L")
    assert_equal 8, Kitchen::Covers.for("XL")
  end

  test "caps human expo at 8 and the agent line at 24" do
    assert_equal 8, Kitchen::Covers::HUMAN_CAP
    assert_equal 24, Kitchen::Covers::AGENT_CAP
  end
end
