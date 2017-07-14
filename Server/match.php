<?php
	class match extends Thread
	{
		/*
		 * The player_id and player_turn
		 * is the zero based index
		 * of their socket in player_sockets.
		 */
		
		public $player_sockets = [];
		
		private $player_turn = 0;
		
		private $game_board = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
		
		public function run()
		{
			// Main match loop.
			while (true)
			{
				set_time_limit(60);
				
				$this->socket_write($this->player_turn, 'turn:' . $this->player_turn . "\n");
				$move = $this->socket_read($this->player_turn, 256);
				$this->validate_player_move($move);
			}
		}
		
		private function end_match()
		{
			// Close all player sockets.
			foreach ($this->player_sockets as &$socket)
			{
				socket_close($socket);
			}
			
			// Close match thread.
			$this->kill();
		}
		
		private function validate_player_move($move)
		{
			// Split move into rows[0] and columns[1].
			$move = explode($move, ':');
			
			// Validate the player's move.
			if (true === ctype_digit($move[0] . $move[1]))
			{
				// Get the number of rows and columns.
				$row_count = count($this->game_board);
				$col_count = count($this->game_board[0]);
				
				// Validate the player's move.
				if ($move[0] > -1 && $move[0] < $row_count)
				{
					if ($move[1] > -1 && $move[1] < $col_count)
					{
						// Check if another player already took the slot.
						if (-1 === $this->game_board[$move[0]][$move[1]])
						{
							// Set column to player id.
							$this->game_board[$move[0]][$move[1]] = $this->player_turn;
							
							// Inform other players of the user's move.
							$data = 'move:' . $this->player_turn . ':' . $move[0] . ':' . $move[1];
							for ($i = 0; $i < count($this->player_sockets); $i++)
							{
								$this->socket_write($i, $data);
							}
							
							// Start next player's turn.
							$this->player_turn++;
							if ($this->player_turn === count($this->player_sockets))
							{
								$this->player_turn = 0;
							}
							
							return;
						}
					}
				}
			}
			
			// Invalid move, tell player to try again.
			$this->socket_write($this->player_turn, 'error:');
		}
		
		private function socket_write($player_id, $data)
		{
			// Send data to given socket and check if successful.
			if (false === socket_write($this->player_sockets[$player_id], $data, strlen($data)))
			{
				// Inform other users of disconnected player.
				$data = 'error:';
				for ($i = 0; $i < count($this->player_sockets); $i++)
				{
					socket_write($this->player_sockets[$i], $data, strlen($data));
				}
				
				$this->end_match();
			}
		}
		
		private function socket_read($player_id, $length)
		{
			// Send data to given socket and check if successful.
			if (false === ($result = socket_read($this->player_sockets[$player_id], $length, PHP_NORMAL_READ)))
			{
				// Inform other users of disconnected player.
				$data = 'error:';
				for ($i = 0; $i < count($this->player_sockets); $i++)
				{
					socket_write($this->player_sockets[$i], $data, strlen($data));
				}
				
				$this->end_match();
			}
			
			return $result;
		}
	}