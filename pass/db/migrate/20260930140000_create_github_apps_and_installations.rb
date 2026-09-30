class CreateGithubAppsAndInstallations < ActiveRecord::Migration[8.1]
  def change
    create_table :github_apps do |t|
      t.integer :github_id, null: false
      t.string :slug
      t.string :name
      t.string :html_url
      t.text :pem, null: false
      t.string :webhook_secret, null: false, default: ""
      t.string :client_id
      t.string :client_secret
      t.timestamps
    end
    add_index :github_apps, :github_id, unique: true

    create_table :installations do |t|
      t.references :github_app, foreign_key: true
      t.integer :github_installation_id, null: false
      t.string :account_login
      t.timestamps
    end
    add_index :installations, :github_installation_id, unique: true

    create_table :installation_repos do |t|
      t.references :installation, null: false, foreign_key: true
      t.string :owner, null: false
      t.string :name, null: false
      t.timestamps
    end
    add_index :installation_repos, [ :owner, :name ], unique: true
  end
end
