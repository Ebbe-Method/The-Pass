module Kitchen
  module Refresh
    def self.call(owner:, repo:, credentials:, http:)
      token = Github.installation_token(
        app_id: credentials.app_id,
        private_key: credentials.private_key,
        installation_id: credentials.installation_id,
        http: http
      )
      issues = Github.list_open_issues(token: token, owner: owner, repo: repo, http: http)
      Snapshot.replace!(owner: owner, repo: repo, issues: issues)
    end
  end
end
