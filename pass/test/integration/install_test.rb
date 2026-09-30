require "test_helper"
require "openssl"

class InstallTest < ActionDispatch::IntegrationTest
  setup do
    @previous_http = Rails.application.config.x.github_http
    @previous_credentials = Kitchen::Credentials.current
    Kitchen::Credentials.current = nil
  end

  teardown do
    Rails.application.config.x.github_http = @previous_http
    Kitchen::Credentials.current = @previous_credentials
  end

  test "the install form uses the request host" do
    get "/install"

    assert_response :success
    assert_match "http://www.example.com/api/webhook", response.body
    assert_match "http://www.example.com/install", response.body
    assert_match "http://www.example.com/auth/github/callback", response.body
    assert_no_match(/the-pass-theta/, response.body)
    assert_no_match(/kitchen-board-sigma/, response.body)
    assert_select "button", text: "Create the GitHub App"
  end

  test "a manifest code stores the App and sends the browser to install" do
    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      assert_equal "POST", call[:method]
      assert_equal "https://api.github.com/app-manifests/abc/conversions", call[:url]
      Kitchen::Http::Response.new(200, {
        "id" => 7,
        "slug" => "the-pass",
        "name" => "The Pass",
        "html_url" => "https://github.com/apps/the-pass",
        "pem" => "SECRET_PEM",
        "webhook_secret" => "hook",
        "client_id" => "Iv1.abc",
        "client_secret" => "oauth-secret"
      })
    end

    get "/install", params: { code: "abc" }

    assert_redirected_to "https://github.com/apps/the-pass/installations/new"
    app = GithubApp.record
    assert_equal 7, app.github_id
    assert_equal "SECRET_PEM", app.pem
    assert_equal "hook", app.webhook_secret
    assert_equal "Iv1.abc", app.client_id
    assert_equal "the-pass", app.slug
  end

  test "sign in with GitHub stores the person and offers the repo picker" do
    GithubApp.create!(
      github_id: 7,
      slug: "the-pass",
      name: "The Pass",
      html_url: "https://github.com/apps/the-pass",
      pem: "SECRET_PEM",
      webhook_secret: "hook",
      client_id: "Iv1.abc",
      client_secret: "oauth-secret"
    )

    get "/install"
    assert_select "a", text: "Sign in with GitHub"
    assert_select "a", { text: "Install on repositories", count: 0 }

    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      if call[:url].include?("login/oauth/access_token")
        assert_equal "POST", call[:method]
        Kitchen::Http::Response.new(200, { "access_token" => "ghu_user" })
      else
        assert_equal "https://api.github.com/user", call[:url]
        Kitchen::Http::Response.new(200, { "login" => "octocat", "id" => 1 })
      end
    end

    get "/auth/github"
    assert_response :redirect
    state = session[:github_oauth_state]
    assert_match "client_id=Iv1.abc", response.location
    assert_match "state=#{state}", response.location

    get "/auth/github/callback", params: { code: "oauth-code", state: state }

    assert_redirected_to "/install"
    assert_equal "octocat", session[:github_login]
    follow_redirect!
    assert_select "a[href='https://github.com/apps/the-pass/installations/new']", text: "Install on repositories"
  end

  test "an installation id stores that installation and opens the only repo" do
    key = OpenSSL::PKey::RSA.generate(2048)
    GithubApp.create!(
      github_id: 7,
      slug: "the-pass",
      html_url: "https://github.com/apps/the-pass",
      pem: key.to_pem,
      webhook_secret: "hook",
      client_id: "Iv1.abc",
      client_secret: "oauth-secret"
    )
    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      if call[:url].include?("access_tokens")
        assert_match %r{/app/installations/99/access_tokens\z}, call[:url]
        Kitchen::Http::Response.new(200, { "token" => "ghs_install" })
      else
        assert_includes call[:url], "/installation/repositories"
        Kitchen::Http::Response.new(200, {
          "repositories" => [
            { "name" => "widgets", "full_name" => "acme/widgets", "owner" => { "login" => "acme" } }
          ]
        })
      end
    end

    get "/install", params: { installation_id: "99" }

    assert_redirected_to "/acme/widgets"
    installation = Installation.for_repo("acme", "widgets")
    assert_equal 99, installation.github_installation_id
    assert_equal 7, installation.github_app.github_id
  end

  test "several repos stay on the install page so the person can pick" do
    key = OpenSSL::PKey::RSA.generate(2048)
    GithubApp.create!(
      github_id: 7,
      slug: "the-pass",
      html_url: "https://github.com/apps/the-pass",
      pem: key.to_pem,
      webhook_secret: "hook",
      client_id: "Iv1.abc",
      client_secret: "oauth-secret"
    )
    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      if call[:url].include?("access_tokens")
        Kitchen::Http::Response.new(200, { "token" => "ghs_install" })
      else
        Kitchen::Http::Response.new(200, {
          "repositories" => [
            { "name" => "one", "owner" => { "login" => "acme" } },
            { "name" => "two", "owner" => { "login" => "acme" } }
          ]
        })
      end
    end

    get "/install", params: { installation_id: "99" }

    assert_response :success
    assert_select "a[href='/acme/one']"
    assert_select "a[href='/acme/two']"
    assert_equal 2, InstallationRepo.count
  end

  test "the wall refreshes from the stored installation without a session" do
    key = OpenSSL::PKey::RSA.generate(2048)
    app = GithubApp.create!(
      github_id: 7,
      slug: "the-pass",
      html_url: "https://github.com/apps/the-pass",
      pem: key.to_pem,
      webhook_secret: "hook",
      client_id: "Iv1.abc",
      client_secret: "oauth-secret"
    )
    installation = app.installations.create!(github_installation_id: 99, account_login: "acme")
    installation.installation_repos.create!(owner: "acme", name: "widgets")
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: nil,
      private_key: nil,
      webhook_secret: "",
      installation_id: nil
    )
    Rails.application.config.x.github_http = RecordingHttp.new do |call|
      if call[:url].include?("access_tokens")
        assert_match %r{/app/installations/99/access_tokens\z}, call[:url]
        Kitchen::Http::Response.new(200, { "token" => "ghs_live" })
      else
        Kitchen::Http::Response.new(200, [
          {
            "id" => 3,
            "number" => 3,
            "title" => "From the stored installation",
            "html_url" => "https://github.com/acme/widgets/issues/3",
            "created_at" => "2026-09-09T12:00:00Z",
            "updated_at" => "2026-09-09T18:00:00Z",
            "labels" => [ { "name" => "size:S" }, { "name" => "status:in-flight" } ],
            "comments" => 1
          }
        ])
      end
    end

    get "/acme/widgets"

    assert_response :success
    assert_match "From the stored installation", response.body
    assert_nil session[:github_login]
    assert_equal "none", Board.find_for("acme", "widgets").tickets.sole.ci
  end

  test "a signed installation webhook stores the installation" do
    GithubApp.create!(
      github_id: 7,
      slug: "the-pass",
      html_url: "https://github.com/apps/the-pass",
      pem: "SECRET_PEM",
      webhook_secret: "hook-secret",
      client_id: "Iv1.abc",
      client_secret: "oauth-secret"
    )
    Kitchen::Credentials.current = Kitchen::Credentials::Github.new(
      app_id: "7",
      private_key: "SECRET_PEM",
      webhook_secret: "hook-secret",
      installation_id: nil
    )
    body = JSON.generate({
      "action" => "created",
      "installation" => { "id" => 55, "account" => { "login" => "acme" } },
      "repositories" => [ { "full_name" => "acme/widgets" } ]
    })

    post "/api/webhook",
      params: body,
      headers: {
        "CONTENT_TYPE" => "application/json",
        "X-Hub-Signature-256" => "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", "hook-secret", body),
        "X-GitHub-Event" => "installation"
      }

    assert_response :success
    assert_equal 55, Installation.for_repo("acme", "widgets").github_installation_id
  end

  test "a blank config client still posts the manifest code" do
    Rails.application.config.x.github_http = ActiveSupport::OrderedOptions.new
    singleton = class << Kitchen::Http; self; end
    singleton.alias_method :new_before_blank_client_test, :new
    singleton.define_method(:new) do
      client = new_before_blank_client_test
      client.define_singleton_method(:call) do |url, method:, headers:, body: nil|
        Kitchen::Http::Response.new(422, '{"message":"expired"}')
      end
      client
    end

    get "/install", params: { code: "abc" }

    assert_response :success
    assert_match "manifest conversion failed (422", response.body
    assert_match "expired", response.body
    assert_no_match(/NoMethodError/, response.body)
  ensure
    if singleton&.method_defined?(:new_before_blank_client_test)
      singleton.alias_method :new, :new_before_blank_client_test
      singleton.remove_method :new_before_blank_client_test
    end
  end
end
