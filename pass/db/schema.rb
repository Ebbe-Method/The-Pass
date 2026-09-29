# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_29_120000) do
  create_table "boards", force: :cascade do |t|
    t.string "owner", null: false
    t.string "repo", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner", "repo"], name: "index_boards_on_owner_and_repo", unique: true
  end

  create_table "progress_events", force: :cascade do |t|
    t.integer "ticket_id", null: false
    t.string "kind", null: false
    t.datetime "occurred_at", null: false
    t.string "actor", default: "unknown", null: false
    t.string "label", default: "", null: false
    t.boolean "bot", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ticket_id"], name: "index_progress_events_on_ticket_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.integer "board_id", null: false
    t.string "github_id"
    t.integer "number", null: false
    t.string "kind", null: false
    t.string "title", null: false
    t.string "url", null: false
    t.datetime "opened_at", null: false
    t.string "size", null: false
    t.json "labels", default: [], null: false
    t.string "ci", default: "none", null: false
    t.boolean "has_linked_pr", default: false, null: false
    t.integer "comment_count", default: 0, null: false
    t.string "runtime", default: "unknown", null: false
    t.string "session_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["board_id", "number"], name: "index_tickets_on_board_id_and_number", unique: true
    t.index ["board_id"], name: "index_tickets_on_board_id"
  end

  add_foreign_key "progress_events", "tickets"
  add_foreign_key "tickets", "boards"
end
