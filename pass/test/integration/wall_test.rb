require "test_helper"

class WallTest < ActionDispatch::IntegrationTest
  setup do
    @previous_http = Rails.application.config.x.github_http
    @previous_credentials = Kitchen::Credentials.current
  end

  teardown do
    Rails.application.config.x.github_http = @previous_http
    Kitchen::Credentials.current = @previous_credentials
  end

  test "the homepage is the fixture wall" do
    get "/"
    assert_response :success
    assert_select "h1", "Your agents are cooking."
    assert_match "Merge-queue attestation for user-visible work", response.body
    assert_select ".pass-expo"
    assert_select ".pass-line"
    assert_match(/in the well/, response.body)
    assert_select ".cover-meter", minimum: 2
    assert_select "a.ticket[href*='github.com/fuseon-connections/fuse-on-v2']"
    assert_select "[data-controller='clock']"
  end

  test "pits and stations are the other layouts" do
    get "/?layout=pits"
    assert_select "h2", text: "Waiting"
    assert_select "h2", text: "Cooking"

    get "/?layout=stations"
    assert_select "h2", text: "cursor"
    assert_select "h2", text: "claude"
  end

  test "a live board refreshes from GitHub" do
    key = OpenSSL::PKey::RSA.generate(2048)
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: "12345",
      private_key: key.to_pem,
      webhook_secret: "hook",
      installation_id: "77"
    )
    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      if call[:url].include?("access_tokens")
        Kitchen::Http::Response.new(200, { "token" => "ghs_live" })
      else
        Kitchen::Http::Response.new(200, [
          {
            "id" => 9,
            "number" => 9,
            "title" => "Live from Fuse On",
            "html_url" => "https://github.com/fuseon-connections/fuse-on-v2/issues/9",
            "created_at" => "2026-09-09T12:00:00Z",
            "updated_at" => "2026-09-09T18:00:00Z",
            "labels" => [ { "name" => "size:M" }, { "name" => "status:in-flight" } ],
            "comments" => 1
          }
        ])
      end
    end

    get "/fuseon-connections/fuse-on-v2"
    assert_response :success
    assert_match "Live from Fuse On", response.body
    assert_equal "none", Board.find_for("fuseon-connections", "fuse-on-v2").tickets.sole.ci
  end

  test "renders the stored board when GitHub refresh throws" do
    board = Board.create!(owner: "fuseon-connections", repo: "fuse-on-v2")
    board.tickets.create!(
      github_id: "1",
      number: 1,
      kind: "issue",
      title: "Last good board",
      url: "https://github.com/fuseon-connections/fuse-on-v2/issues/1",
      opened_at: Time.iso8601("2026-09-09T12:00:00Z"),
      size: "S",
      labels: [ "status:in-flight" ],
      ci: "none",
      has_linked_pr: true,
      comment_count: 2,
      runtime: "cursor"
    )
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: "12345",
      private_key: OpenSSL::PKey::RSA.generate(2048).to_pem,
      webhook_secret: "hook",
      installation_id: "77"
    )
    Rails.application.config.x.github_http = RecordingHttp.new { raise "github down" }

    get "/fuseon-connections/fuse-on-v2"
    assert_response :success
    assert_match "Last good board", response.body
    assert_no_match(/github down/, response.body)
  end

  test "an empty live board is an empty pass" do
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: "1",
      private_key: "not-used",
      webhook_secret: "hook",
      installation_id: nil
    )

    get "/acme/quiet"
    assert_response :success
    assert_match "The pass is clear.", response.body
  end
end
