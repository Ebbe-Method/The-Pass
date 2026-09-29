require "json"
require "net/http"
require "openssl"
require "uri"

module Kitchen
  class Http
    Response = Struct.new(:status, :body) do
      def ok?
        status.to_i.between?(200, 299)
      end

      def json
        return body if body.is_a?(Hash) || body.is_a?(Array)

        JSON.parse(body.to_s)
      end
    end

    def call(url, method: "GET", headers: {}, body: nil)
      uri = URI(url)
      request = method.to_s.upcase == "POST" ? Net::HTTP::Post.new(uri) : Net::HTTP::Get.new(uri)
      headers.each { |key, value| request[key] = value }
      request.body = body if body
      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
        response = http.request(request)
        Response.new(response.code.to_i, response.body)
      end
    end
  end
end
