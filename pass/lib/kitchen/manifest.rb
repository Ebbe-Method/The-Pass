module Kitchen
  module Manifest
    def self.build(host)
      root = host.to_s.sub(%r{/+\z}, "")
      {
        "name" => "The Pass Eddy",
        "url" => root,
        "hook_attributes" => { "url" => "#{root}/api/webhook", "active" => true },
        "redirect_url" => "#{root}/install",
        "callback_urls" => [ "#{root}/auth/github/callback" ],
        "setup_url" => "#{root}/install",
        "setup_on_update" => true,
        "public" => true,
        "default_permissions" => {
          "issues" => "read",
          "pull_requests" => "read",
          "checks" => "read",
          "contents" => "read",
          "actions" => "read",
          "metadata" => "read"
        },
        "default_events" => %w[
          issues
          issue_comment
          pull_request
          pull_request_review
          push
          check_run
          workflow_run
        ]
      }
    end
  end
end
