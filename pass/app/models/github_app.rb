class GithubApp < ApplicationRecord
  has_many :installations, dependent: :destroy

  validates :github_id, :pem, presence: true

  def self.record
    order(:id).first
  end

  def self.remember!(body)
    app = record || new
    app.update!(
      github_id: body["id"],
      slug: body["slug"],
      name: body["name"],
      html_url: body["html_url"],
      pem: body["pem"],
      webhook_secret: body["webhook_secret"].to_s,
      client_id: body["client_id"],
      client_secret: body["client_secret"]
    )
    app
  end
end
