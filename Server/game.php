<?php
	session_start();
	game::start();
	
	class game
	{
		private static $players = [];
		private static $turn = 0;
		private static $board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		
		public static function start()
		{
			set_time_limit(10);
			
			array_push(self::$players, $_SESSION['players'][0]);
			array_push(self::$players, $_SESSION['players'][1]);
			$_SESSION['players'] = [];
			
			self::play();
		}
		
		private static function play()
		{
			while (true)
			{
				set_time_limit(60);
				self::player_write(self::$turn, "Server: Your turn.\n");
				$move = self::player_read(self::$turn, 256);
				self::validate_move($move);
				
				if (0 === self::$turn)
				{
					self::$turn = 1;
				}
				else
				{
					self::$turn = 0;
				}
			}
		}
		
		private static function validate_move($move)
		{
			if (true === ctype_digit($move) && 2 === strlen($move))
			{
				$row = substr($move, 0, 1);
				$col = substr($move, 1, 1);
				
				if (0 <= $row && 2 >= $row)
				{
					if (0 <= $col && 2 >= $col)
					{
						if (0 === self::$board[$row][$col])
						{
							self::$board[$row][$col] = self::$turn + 1;
							
							self::player_write(0, "Server: Move $move\n");
							self::player_write(1, "Server: Move $move\n");
						}
					}
				}
			}
		}
		
		private static function player_read($player, $size)
		{
			if (false === ($data = socket_read(self::$players[$player], $size, PHP_NORMAL_READ)))
			{
				array_splice(self::$players, $player, 1);
				return false;
			}
			
			return $data;
		}
		
		private static function player_write($player, $data)
		{
			if (false === socket_write(self::$players[$player], $data, strlen($data)))
			{
				array_splice(self::$players, $player, 1);
				return false;
			}
			
			return true;
		}
	}