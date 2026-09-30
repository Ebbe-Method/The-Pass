module Kitchen
  Arrangement = Struct.new(
    :expo, :line, :well_count, :human_covers, :agent_covers,
    :human_cap, :agent_cap, :human_slammed, :agent_slammed,
    keyword_init: true
  )
end
