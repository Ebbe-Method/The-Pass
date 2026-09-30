class Installation < ApplicationRecord
  belongs_to :github_app, optional: true
  has_many :installation_repos, dependent: :destroy

  validates :github_installation_id, presence: true, uniqueness: true

  def self.for_repo(owner, repo)
    joins(:installation_repos).find_by(
      installation_repos: {
        owner: owner.to_s.downcase,
        name: repo.to_s.downcase
      }
    )
  end

  def self.record!(app:, github_installation_id:, account_login: nil, repos: [])
    installation = find_or_initialize_by(github_installation_id: github_installation_id)
    installation.github_app = app if app
    installation.account_login = account_login if account_login.present?
    installation.save!
    replace_repos!(installation, repos) if repos.any?
    installation
  end

  def self.replace_repos!(installation, repos)
    installation.installation_repos.destroy_all
    repos.each do |repo|
      owner = repo[:owner].to_s.downcase
      name = repo[:name].to_s.downcase
      next if owner.blank? || name.blank?

      InstallationRepo.where(owner: owner, name: name).delete_all
      installation.installation_repos.create!(owner: owner, name: name)
    end
  end
end
