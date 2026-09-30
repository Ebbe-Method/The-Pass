require "base64"
require "cgi"
require "json"
require "openssl"

module Kitchen
  module Github
    class Error < StandardError; end

    API = "https://api.github.com"
    CAP = 500
    CLAIM = /<!--\s*kitchen:claim\s+runtime="([^"]+)"(?:\s+session="([^"]+)")?\s*-->/
    RUNTIMES = %w[cursor claude copilot human bot unknown].freeze

    def self.normalize_key(pem)
      pem.to_s.gsub("\\n", "\n").strip
    end

    def self.jwt(app_id:, private_key:, now: Time.now)
      issued = now.to_i
      header = encode_json({ alg: "RS256", typ: "JWT" })
      payload = encode_json({ iat: issued - 60, exp: issued + (9 * 60), iss: app_id.to_s })
      unsigned = "#{header}.#{payload}"
      key = OpenSSL::PKey::RSA.new(normalize_key(private_key))
      signature = Base64.urlsafe_encode64(key.sign(OpenSSL::Digest::SHA256.new, unsigned), padding: false)
      "#{unsigned}.#{signature}"
    end

    def self.installation_token(app_id:, private_key:, installation_id:, http:, now: Time.now)
      token = jwt(app_id: app_id, private_key: private_key, now: now)
      body = json("/app/installations/#{installation_id}/access_tokens", token, http, method: "POST")
      body.fetch("token")
    end

    def self.convert_manifest(code, http:)
      response = http.call(
        "#{API}/app-manifests/#{escape(code)}/conversions",
        method: "POST",
        headers: {
          "Accept" => "application/vnd.github+json",
          "X-GitHub-Api-Version" => "2022-11-28",
          "User-Agent" => "the-pass-kiosk"
        }
      )
      raise Error, "manifest conversion failed (#{response.status})" unless response.ok?

      body = response.json
      raise Error, "manifest conversion missing id or pem" if body["id"].blank? || body["pem"].blank?

      body
    end

    def self.exchange_user_token(client_id:, client_secret:, code:, http:)
      response = http.call(
        "https://github.com/login/oauth/access_token",
        method: "POST",
        headers: {
          "Accept" => "application/json",
          "Content-Type" => "application/json",
          "User-Agent" => "the-pass-kiosk"
        },
        body: JSON.generate(client_id: client_id, client_secret: client_secret, code: code)
      )
      raise Error, "GitHub sign-in failed (#{response.status})" unless response.ok?

      token = response.json["access_token"]
      raise Error, "GitHub sign-in missing access token" if token.blank?

      token
    end

    def self.current_user(token, http)
      json("/user", token, http)
    end

    def self.list_installation_repositories(token:, http:)
      repos = []
      page = 1
      while page <= 5
        body = json("/installation/repositories?per_page=100&page=#{page}", token, http)
        batch = body["repositories"] || []
        batch.each do |repo|
          owner = repo.dig("owner", "login").presence || repo["full_name"].to_s.split("/").first
          name = repo["name"]
          repos << { owner: owner, name: name } if owner.present? && name.present?
        end
        break if batch.length < 100

        page += 1
      end
      repos
    end

    def self.list_open_issues(token:, owner:, repo:, http:)
      issues = []
      page = 1
      while issues.length < CAP && page <= 5
        path = "/repos/#{escape(owner)}/#{escape(repo)}/issues?state=open&per_page=100&page=#{page}"
        batch = json(path, token, http)
        break unless batch.is_a?(Array)

        issues.concat(batch)
        break if batch.length < 100

        page += 1
      end
      issues.first(CAP)
    end

    def self.ticket_from_issue(owner, repo, issue)
      labels = label_names(issue["labels"])
      kind = issue["pull_request"] ? "pr" : "issue"
      body = issue["body"]
      title = issue["title"].nil? ? "Untitled" : issue["title"]
      plate = Plate.new(
        id: (issue["id"] || issue["number"]).to_s,
        number: issue["number"],
        kind: kind,
        title: title,
        url: issue["html_url"].presence || default_url(owner, repo, kind, issue["number"]),
        opened_at: issue["created_at"] || Time.now.utc.iso8601(3),
        size: Size.for_ticket(kind: kind, labels: labels, body: body, milestone: issue["milestone"]),
        labels: labels,
        events: [],
        ci: "none",
        has_linked_pr: issue["pull_request"].present? || kind == "pr",
        comment_count: issue["comments"].to_i,
        runtime: "unknown"
      )
      apply_claim(plate, body)
      plate
    end

    def self.moved?(issue)
      created = issue["created_at"]
      updated = issue["updated_at"]
      return false if created.blank? || updated.blank?

      Time.iso8601(updated.to_s) > Time.iso8601(created.to_s)
    end

    def self.label_names(labels)
      Array(labels).map { |label| label.is_a?(Hash) ? label["name"].to_s : label.to_s }
    end

    def self.apply_claim(plate, html)
      return plate if html.blank?

      match = CLAIM.match(html.to_s)
      return plate unless match

      runtime = match[1].to_s
      plate.runtime = RUNTIMES.include?(runtime) ? runtime : "unknown"
      plate.session_url = match[2] if match[2].present?
      plate
    end

    def self.json(path, token, http, method: "GET")
      response = http.call(
        "#{API}#{path}",
        method: method,
        headers: {
          "Authorization" => "Bearer #{token}",
          "Accept" => "application/vnd.github+json",
          "X-GitHub-Api-Version" => "2022-11-28",
          "User-Agent" => "the-pass-kiosk"
        }
      )
      raise Error, "GitHub #{response.status} #{path}: #{response.body.to_s[0, 200]}" unless response.ok?

      response.json
    end

    def self.encode_json(value)
      Base64.urlsafe_encode64(JSON.generate(value), padding: false)
    end

    def self.escape(value)
      CGI.escape(value.to_s)
    end

    def self.default_url(owner, repo, kind, number)
      segment = kind == "pr" ? "pull" : "issues"
      "https://github.com/#{owner}/#{repo}/#{segment}/#{number}"
    end
  end
end
