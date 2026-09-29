class Board < ApplicationRecord
  has_many :tickets, dependent: :destroy

  validates :owner, :repo, presence: true
  validates :repo, uniqueness: { scope: :owner }

  before_validation :downcase_names

  def self.find_for(owner, repo)
    find_by(owner: owner.to_s.downcase, repo: repo.to_s.downcase)
  end

  def self.find_or_create_for!(owner, repo)
    find_or_create_by!(owner: owner.to_s.downcase, repo: repo.to_s.downcase)
  end

  private
    def downcase_names
      self.owner = owner.to_s.downcase
      self.repo = repo.to_s.downcase
    end
end
