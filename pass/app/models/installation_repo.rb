class InstallationRepo < ApplicationRecord
  belongs_to :installation

  validates :owner, :name, presence: true
end
