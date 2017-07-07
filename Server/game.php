<?php
	class game extends Thread
	{
		public $players = [];
		private $turn = 0;
		private $board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		
		public function run()
		{
			set_time_limit(10);
			$this->play();
		}
		
		private function play()
		{
			while (true)
			{
				set_time_limit(60);
				$this->player_write($this->turn, "Server: Your turn.\n");
				$move = $this->player_read($this->turn, 256);
				$this->validate_move($move);
				
				if (0 === $this->turn)
				{
					$this->turn = 1;
				}
				else
				{
					$this->turn = 0;
				}
			}
		}
		
		private function validate_move($move)
		{
			if (true === ctype_digit($move) && 2 === strlen($move))
			{
				$row = (int)substr($move, 0, 1);
				$col = (int)substr($move, 1, 1);
				
				if (0 <= $row && 2 >= $row)
				{
					if (0 <= $col && 2 >= $col)
					{
						if (0 === $this->board[$row][$col])
						{
							$this->board[$row][$col] = $this->turn + 1;
							
							$this->player_write(0, "Server: Move $move\n");
							$this->player_write(1, "Server: Move $move\n");
						}
					}
				}
			}
		}
		
		private function player_read($player, $size)
		{
			if (false === ($data = socket_read($this->players[$player], $size, PHP_NORMAL_READ)))
			{
				array_splice($this->players, $player, 1);
				return false;
			}
			
			return $data;
		}
		
		private function player_write($player, $data)
		{
			if (false === socket_write($this->players[$player], $data, strlen($data)))
			{
				array_splice($this->players, $player, 1);
				return false;
			}
			
			return true;
		}
	}