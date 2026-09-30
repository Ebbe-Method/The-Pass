class SessionsController < ApplicationController
  def new
    app = GithubApp.record
    if app&.client_id.blank?
      redirect_to install_path
      return
    end

    state = SecureRandom.hex(24)
    session[:github_oauth_state] = state
    redirect_to "https://github.com/login/oauth/authorize?#{authorize_query(app, state)}", allow_other_host: true
  end

  def create
    unless oauth_state_matches?
      head :unauthorized
      return
    end

    app = GithubApp.record
    token = Kitchen::Github.exchange_user_token(
      client_id: app.client_id,
      client_secret: app.client_secret,
      code: params[:code],
      http: github_http
    )
    user = Kitchen::Github.current_user(token, github_http)
    session[:github_login] = user["login"]
    session.delete(:github_oauth_state)
    redirect_to install_path
  rescue Kitchen::Github::Error => error
    redirect_to install_path, alert: error.message
  end

  def destroy
    reset_session
    redirect_to install_path
  end

  private
    def authorize_query(app, state)
      {
        client_id: app.client_id,
        state: state,
        redirect_uri: github_callback_url
      }.to_query
    end

    def oauth_state_matches?
      expected = session[:github_oauth_state].to_s
      given = params[:state].to_s
      return false if expected.blank? || expected.bytesize != given.bytesize

      ActiveSupport::SecurityUtils.secure_compare(expected, given)
    end

    def github_http
      Rails.application.config.x.github_http || Kitchen::Http.new
    end
end
