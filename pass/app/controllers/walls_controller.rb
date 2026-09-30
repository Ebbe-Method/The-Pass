class WallsController < ApplicationController
  def demo
    @demo = true
    @owner = "fuseon-connections"
    @repo = "fuse-on-v2"
    @tickets = Kitchen::Demo.tickets
    render_wall
  end

  def show
    @demo = false
    @owner = params[:owner].to_s
    @repo = params[:repo].to_s
    stored = Board.find_for(@owner, @repo)
    access = Kitchen::Access.for(@owner, @repo)
    if access
      begin
        Kitchen::Refresh.call(
          owner: @owner,
          repo: @repo,
          credentials: access,
          http: github_http
        )
      rescue StandardError
        @refresh_failed = stored.present?
      end
    end
    @board = Board.find_for(@owner, @repo)
    @tickets = @board&.tickets&.includes(:progress_events)&.order(:number).to_a
    render_wall
  end

  private
    def render_wall
      @layout = %w[expo pits stations].include?(params[:layout]) ? params[:layout] : "expo"
      @distance = params[:distance] == "10ft" ? "10ft" : "2ft"
      @now = (Time.now.to_r * 1000).round
      @rows = Kitchen::Present.sort(@tickets.map { |ticket| Kitchen::Present.call(ticket, @now) })
      @pass = Kitchen::Layout.call(@rows)
      render :show
    end

    def github_http
      Rails.application.config.x.github_http || Kitchen::Http.new
    end
end
