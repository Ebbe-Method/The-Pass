require "test_helper"

class RecordingHttp
  attr_reader :calls

  def initialize(&handler)
    @handler = handler
    @calls = []
  end

  def call(url, method: "GET", headers: {}, body: nil)
    call = { url: url, method: method, headers: headers, body: body }
    @calls << call
    @handler.call(call)
  end
end
