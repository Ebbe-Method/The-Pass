module Kitchen
  module Signature
    def self.valid?(body, header, secret)
      return false if header.blank? || secret.blank?

      expected = "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", secret, body.to_s)
      return false unless header.bytesize == expected.bytesize

      ActiveSupport::SecurityUtils.secure_compare(expected, header)
    end
  end
end
