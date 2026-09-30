class CreateBoardsAndTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :boards do |t|
      t.string :owner, null: false
      t.string :repo, null: false
      t.timestamps
    end
    add_index :boards, [ :owner, :repo ], unique: true

    create_table :tickets do |t|
      t.references :board, null: false, foreign_key: true
      t.string :github_id
      t.integer :number, null: false
      t.string :kind, null: false
      t.string :title, null: false
      t.string :url, null: false
      t.datetime :opened_at, null: false
      t.string :size, null: false
      t.json :labels, null: false, default: []
      t.string :ci, null: false, default: "none"
      t.boolean :has_linked_pr, null: false, default: false
      t.integer :comment_count, null: false, default: 0
      t.string :runtime, null: false, default: "unknown"
      t.string :session_url
      t.timestamps
    end
    add_index :tickets, [ :board_id, :number ], unique: true

    create_table :progress_events do |t|
      t.references :ticket, null: false, foreign_key: true
      t.string :kind, null: false
      t.datetime :occurred_at, null: false
      t.string :actor, null: false, default: "unknown"
      t.string :label, null: false, default: ""
      t.boolean :bot, null: false, default: false
      t.timestamps
    end
  end
end
