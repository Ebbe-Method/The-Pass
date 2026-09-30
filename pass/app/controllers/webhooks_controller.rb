class WebhooksController < ApplicationController
  skip_forgery_protection

  def create
    body = request.raw_post
    secret = Kitchen::Credentials.github.webhook_secret
    unless Kitchen::Signature.valid?(body, request.headers["X-Hub-Signature-256"], secret)
      head :unauthorized
      return
    end

    payload = JSON.parse(body)
    event = request.headers["X-GitHub-Event"].to_s
    if event == "installation" || event == "installation_repositories"
      Kitchen::InstallFlow.record_payload!(payload)
      head :ok
      return
    end

    repository = payload["repository"] || {}
    owner = repository.dig("owner", "login")
    repo = repository["name"]
    if owner.present? && repo.present?
      Kitchen::Webhook.apply!(
        owner: owner,
        repo: repo,
        event: request.headers["X-GitHub-Event"].to_s,
        payload: payload
      )
    end
    head :ok
  rescue JSON::ParserError
    head :bad_request
  end
end
