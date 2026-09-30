module Kitchen
  module Access
    def self.for(owner, repo)
      installation = Installation.for_repo(owner, repo)
      app = installation&.github_app || GithubApp.record
      if installation && app&.pem.present? && app.github_id.present?
        return Credentials::Github.new(
          app_id: app.github_id,
          private_key: app.pem,
          webhook_secret: app.webhook_secret.to_s,
          installation_id: installation.github_installation_id
        )
      end

      creds = Credentials.github
      return creds if creds.complete?

      nil
    end
  end
end
