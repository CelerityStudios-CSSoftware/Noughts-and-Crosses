def prologue
  "NW 1
NW 2
WC 1
< 1 f:1:2
WC 2
< 1 f:2:2
< 2 f:2:2
< 1 s:0
< 2 s:1

"
end

def epilogue
  "
< 1 w:0
< 2 w:0
< 1 eg
< 2 eg
KW 1
KW 2
"
end

def play_move(move, plid, opid)
  x, y = move
  "< #{plid} t:#{plid - 1}\n" +
  "< #{opid} t:#{plid - 1}\n" +
  "> #{plid} m:#{x}:#{y}\n" +
  "< #{opid} m:#{x}:#{y}"
end

[
  {
    name: "left-column",
    pl: [[0, 0], [0, 1], [0, 2]],
    op: [[1, 1], [1, 0]]
  }, {
    name: "middle-column",
    pl: [[1, 0], [1, 1], [1, 2]],
    op: [[0, 1], [0, 0]]
  }, {
    name: "right-column",
    pl: [[2, 0], [2, 1], [2, 2]],
    op: [[0, 1], [0, 0]]
  }, {
    name: "top-row",
    pl: [[0, 0], [1, 0], [2, 0]],
    op: [[0, 1], [0, 2]]
  }, {
    name: "middle-row",
    pl: [[0, 1], [1, 1], [2, 1]],
    op: [[1, 0], [0, 0]]
  }, {
    name: "bottom-row",
    pl: [[0, 2], [1, 2], [2, 2]],
    op: [[0, 1], [0, 0]]
  }, {
    name: "lr-diagonal",
    pl: [[0, 0], [1, 1], [2, 2]],
    op: [[2, 1], [2, 0]]
  }, {
    name: "rl-diagonal",
    pl: [[2, 0], [1, 1], [0, 2]],
    op: [[0, 1], [0, 0]]
  }
].each do |script|
  script_file_path = "win-#{script[:name]}.sasm"
  script_file = File.new(script_file_path, "w")
  script_file.puts prologue

  moves = script[:pl].zip(script[:op])
  moves.each do |pl, op|
    script_file.puts play_move(pl, 1, 2) unless pl.nil?
    script_file.puts play_move(op, 2, 1) unless op.nil?
  end

  script_file.puts epilogue
end
