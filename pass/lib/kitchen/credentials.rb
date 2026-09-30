module Kitchen
  module Credentials
    Github = Data.define(:app_id, :private_key, :webhook_secret, :installation_id) do
      def complete?
        app_id.present? && private_key.present? && webhook_secret.present? && installation_id.present?
      end
    end

    class << self
      attr_accessor :current

      def github
        return current if current

        app = GithubApp.record
        Github.new(
          app_id: app&.github_id || read("GITHUB_APP_ID"),
          private_key: app&.pem.presence || Kitchen::Github.normalize_key(read("GITHUB_APP_PRIVATE_KEY")),
          webhook_secret: app&.webhook_secret.presence || read("GITHUB_WEBHOOK_SECRET").to_s,
          installation_id: read("GITHUB_INSTALLATION_ID")
        )
      end

      def read(key)
        env = ENV[key]
        return env if env.present?

        creds = Rails.application.credentials
        creds.dig(key.to_sym) || creds.dig(:github, key.delete_prefix("GITHUB_").downcase.to_sym)
      rescue ActiveSupport::MessageEncryptor::InvalidMessage, ArgumentError
        nil
      end
    end
  end
end
