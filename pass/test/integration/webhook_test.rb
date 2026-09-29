require "test_helper"

class WebhookTest < ActionDispatch::IntegrationTest
  SECRET = "test-hook-secret"

  setup do
    @previous = Kitchen::Credentials.current
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: "1",
      private_key: "pem",
      webhook_secret: SECRET,
      installation_id: "2"
    )
  end

  teardown do
    Kitchen::Credentials.current = @previous
  end

  test "rejects a missing signature" do
    post "/api/webhook", params: payload, as: :json
    assert_response :unauthorized
    assert_equal 0, Board.count
  end

  test "rejects a bad signature" do
    post "/api/webhook",
      params: payload,
      as: :json,
      headers: { "X-Hub-Signature-256" => "sha256=deadbeef" }
    assert_response :unauthorized
    assert_equal 0, Board.count
  end

  test "a valid fixture payload updates the stored board" do
    body = file_fixture("github_issue_webhook.json").read
    post "/api/webhook",
      params: body,
      headers: {
        "CONTENT_TYPE" => "application/json",
        "X-Hub-Signature-256" => signature(body),
        "X-GitHub-Event" => "issues"
      }

    assert_response :success
    board = Board.find_for("fuseon-connections", "fuse-on-v2")
    assert_equal "Heat the pass", board.tickets.sole.title
    assert_equal "none", board.tickets.sole.ci
    assert_equal "in-flight", Kitchen::Size.kitchen_chip(board.tickets.sole.labels)
  end

  test "keeps an inferred size when a later webhook has no size label" do
    opened = {
      "action" => "opened",
      "repository" => { "name" => "infer-lab", "owner" => { "login" => "acme" } },
      "issue" => {
        "id" => 11,
        "number" => 91,
        "title" => "Long unlabeled",
        "html_url" => "https://github.com/acme/infer-lab/issues/91",
        "created_at" => "2026-09-09T12:00:00Z",
        "labels" => [],
        "comments" => 0,
        "body" => "x" * 1500
      }
    }
    post_signed("issues", opened)

    labeled = {
      "action" => "labeled",
      "repository" => { "name" => "infer-lab", "owner" => { "login" => "acme" } },
      "issue" => {
        "id" => 11,
        "number" => 91,
        "title" => "Long unlabeled",
        "html_url" => "https://github.com/acme/infer-lab/issues/91",
        "labels" => [ { "name" => "status:in-flight" } ],
        "comments" => 0
      },
      "label" => { "name" => "status:in-flight" }
    }
    post_signed("issues", labeled)

    assert_equal "L", Board.find_for("acme", "infer-lab").tickets.sole.size
    assert_equal "label", Board.find_for("acme", "infer-lab").tickets.sole.progress_events.sole.kind
  end

  private

  def payload
    JSON.parse(file_fixture("github_issue_webhook.json").read)
  end

  def signature(body)
    "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", SECRET, body)
  end

  def post_signed(event, hash)
    body = JSON.generate(hash)
    post "/api/webhook",
      params: body,
      headers: {
        "CONTENT_TYPE" => "application/json",
        "X-Hub-Signature-256" => signature(body),
        "X-GitHub-Event" => event
      }
    assert_response :success
  end
end
