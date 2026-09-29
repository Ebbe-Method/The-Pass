class ProgressEvent < ApplicationRecord
  belongs_to :ticket

  validates :kind, :occurred_at, presence: true

  def at
    occurred_at
  end
end
