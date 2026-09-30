require "test_helper"
require "openssl"

class GithubTest < ActiveSupport::TestCase
  test "signs an RS256 JWT whose payload names the App id" do
    key = OpenSSL::PKey::RSA.generate(2048)
    now = Time.iso8601("2026-09-09T12:00:00Z")
    token = Kitchen::Github.jwt(app_id: "12345", private_key: key.to_pem, now: now)
    header, payload, signature = token.split(".")
    decoded = JSON.parse(Base64.urlsafe_decode64(payload))

    assert_equal "12345", decoded["iss"]
    assert_equal 10 * 60, decoded["exp"] - decoded["iat"]
    assert_equal 3, token.split(".").length
    assert key.public_key.verify(
      OpenSSL::Digest::SHA256.new,
      Base64.urlsafe_decode64(signature),
      "#{header}.#{payload}"
    )
  end

  test "mints an installation token with the JWT" do
    key = OpenSSL::PKey::RSA.generate(2048)
    http = RecordingHttp.new do |call|
      assert_equal "POST", call[:method]
      assert_equal "https://api.github.com/app/installations/99/access_tokens", call[:url]
      assert_match(/\ABearer .+/, call[:headers]["Authorization"])
      json_response("token" => "ghs_test")
    end

    token = Kitchen::Github.installation_token(
      app_id: "12345",
      private_key: key.to_pem,
      installation_id: "99",
      http: http
    )

    assert_equal "ghs_test", token
  end

  test "lists open issues and pull requests up to 500 and never asks for check runs" do
    http = RecordingHttp.new do |call|
      page = call[:url][/page=(\d+)/, 1].to_i
      json_response(Array.new(100) { |index| issue((page - 1) * 100 + index + 1) })
    end

    issues = Kitchen::Github.list_open_issues(
      token: "ghs_test",
      owner: "fuseon-connections",
      repo: "fuse-on-v2",
      http: http
    )

    assert_equal 500, issues.length
    assert_equal [ 1, 2, 3, 4, 5 ], http.calls.map { |call| call[:url][/[&?]page=(\d+)/, 1].to_i }
    assert http.calls.none? { |call| call[:url].include?("check") }
    assert http.calls.all? { |call| call[:url].include?("state=open") }
  end

  test "stops before the cap when a page is short" do
    http = RecordingHttp.new do |_call|
      json_response([ issue(1), issue(2) ])
    end

    issues = Kitchen::Github.list_open_issues(
      token: "ghs_test",
      owner: "acme",
      repo: "widgets",
      http: http
    )

    assert_equal 2, issues.length
    assert_equal 1, http.calls.length
  end

  test "maps an issue with a size label and leaves ci none" do
    ticket = Kitchen::Github.ticket_from_issue("acme", "widgets", {
      "id" => 99,
      "number" => 12,
      "title" => "Unstick stale tickets",
      "html_url" => "https://github.com/acme/widgets/issues/12",
      "created_at" => "2026-09-09T12:00:00Z",
      "updated_at" => "2026-09-09T12:00:00Z",
      "labels" => [ { "name" => "size:S" }, { "name" => "status:in-flight" } ],
      "comments" => 2,
      "body" => '<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-abc" -->'
    })

    assert_equal "issue", ticket.kind
    assert_equal "S", ticket.size
    assert_equal "cursor", ticket.runtime
    assert_equal "https://cursor.com/agents/bc-abc", ticket.session_url
    assert_equal false, ticket.has_linked_pr
    assert_equal "none", ticket.ci
  end

  test "maps a pull request and infers S for a short unlabeled body" do
    ticket = Kitchen::Github.ticket_from_issue("acme", "widgets", {
      "number" => 20,
      "title" => "Typo",
      "html_url" => "https://github.com/acme/widgets/pull/20",
      "labels" => [],
      "pull_request" => { "url" => "https://api.github.com/repos/acme/widgets/pulls/20" },
      "body" => "fix typo",
      "created_at" => "2026-09-09T12:00:00Z",
      "updated_at" => "2026-09-09T12:00:00Z"
    })

    assert_equal "pr", ticket.kind
    assert_equal true, ticket.has_linked_pr
    assert_equal "S", ticket.size
    assert_equal "none", ticket.ci
  end

  test "convert_manifest raises when the client returns nil" do
    http = Object.new
    http.define_singleton_method(:call) { |*| nil }

    error = assert_raises(Kitchen::Github::Error) do
      Kitchen::Github.convert_manifest("abc", http: http)
    end

    assert_equal "manifest conversion failed (no response)", error.message
  end

  test "convert_manifest includes the GitHub status and body" do
    http = Object.new
    http.define_singleton_method(:call) do |*|
      Kitchen::Http::Response.new(422, '{"message":"expired"}')
    end

    error = assert_raises(Kitchen::Github::Error) do
      Kitchen::Github.convert_manifest("abc", http: http)
    end

    assert_equal 'manifest conversion failed (422 {"message":"expired"})', error.message
  end

  private

  def issue(number)
    {
      "id" => number,
      "number" => number,
      "title" => "T#{number}",
      "created_at" => "2026-09-09T12:00:00Z",
      "updated_at" => "2026-09-09T12:00:00Z",
      "labels" => []
    }
  end

  def json_response(body, status = 200)
    Kitchen::Http::Response.new(status, body)
  end
end
