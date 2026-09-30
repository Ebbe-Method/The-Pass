require "test_helper"

class HttpResolveTest < ActiveSupport::TestCase
  test "resolve ignores the blank object config.x returns when unset" do
    blank = ActiveSupport::OrderedOptions.new

    assert_nil blank.call("https://example.test")
    assert_instance_of Kitchen::Http, Kitchen::Http.resolve(blank)
  end

  test "resolve keeps an assigned client" do
    client = Object.new

    assert_same client, Kitchen::Http.resolve(client)
  end
end
