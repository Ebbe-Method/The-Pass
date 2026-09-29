class Ticket < ApplicationRecord
  belongs_to :board
  has_many :progress_events, dependent: :destroy

  validates :number, :kind, :title, :url, :opened_at, :size, presence: true

  def events
    progress_events
  end

  def labels
    Array(self[:labels]).map { |label| label.is_a?(Hash) ? (label["name"] || label[:name]).to_s : label.to_s }
  end
end
