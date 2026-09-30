class InstallsController < ApplicationController
  def show
    if params[:code].present?
      app = Kitchen::InstallFlow.convert!(params[:code], http: github_http)
      redirect_to Kitchen::InstallFlow.install_url(app.html_url), allow_other_host: true
      return
    end

    if params[:installation_id].present?
      installation = Kitchen::InstallFlow.capture!(params[:installation_id], http: github_http)
      repos = installation.installation_repos.order(:owner, :name)
      if repos.one?
        redirect_to repo_board_path(repos.first.owner, repos.first.name)
        return
      end
      @repos = repos
    end

    @app = GithubApp.record
    @login = session[:github_login]
  rescue Kitchen::Github::Error => error
    @message = error.message
    @app = GithubApp.record
    @login = session[:github_login]
  end

end
