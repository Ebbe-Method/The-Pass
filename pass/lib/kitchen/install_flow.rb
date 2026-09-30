module Kitchen
  module InstallFlow
    def self.convert!(code, http:)
      GithubApp.remember!(Github.convert_manifest(code, http: http))
    end

    def self.install_url(html_url)
      "#{html_url.to_s.sub(%r{/+\z}, "")}/installations/new"
    end

    def self.capture!(installation_id, http:)
      app = GithubApp.record
      raise Github::Error, "Create the GitHub App first" unless app&.pem.present?

      token = Github.installation_token(
        app_id: app.github_id,
        private_key: app.pem,
        installation_id: installation_id,
        http: http
      )
      repos = Github.list_installation_repositories(token: token, http: http)
      Installation.record!(
        app: app,
        github_installation_id: installation_id.to_i,
        repos: repos
      )
    end

    def self.record_payload!(payload)
      installation_id = payload.dig("installation", "id").to_i
      return if installation_id <= 0

      if payload["action"] == "deleted"
        Installation.find_by(github_installation_id: installation_id)&.destroy
        return
      end

      Installation.record!(
        app: GithubApp.record,
        github_installation_id: installation_id,
        account_login: payload.dig("installation", "account", "login"),
        repos: repos_from(payload)
      )
    end

    def self.repos_from(payload)
      rows = payload["repositories"] || payload["repositories_added"] || []
      rows.filter_map do |repo|
        full_name = repo["full_name"].to_s
        if full_name.include?("/")
          owner, name = full_name.split("/", 2)
          next if owner.blank? || name.blank?

          { owner: owner, name: name }
        elsif repo.dig("owner", "login").present? && repo["name"].present?
          { owner: repo.dig("owner", "login"), name: repo["name"] }
        end
      end
    end
  end
end
