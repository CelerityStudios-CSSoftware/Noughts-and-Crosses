<?php
	class match
	{
		/*
		 * The player_id and player_turn vars
		 * are the zero based index value
		 * of the player's socket in the player_sockets var.
		 *
		 * Error Code 4: A player has disconnected.
		 *
		 * E:BM - Bad Move.
		 */
		
		public $player_sockets = [];
		
		private $player_turn = 0;
		private $slots_to_win = 3;
		
		private $turns_passed = 0;
		private $turns_required_to_win;
		
		private $grid_size;
		private $game_board = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
		
		public function start()
		{
			$this->turns_required_to_win = $this->slots_to_win + ((count($this->player_sockets) - 1) * 2);
			
			$this->grid_size[0] = count($this->game_board);
			$this->grid_size[1] = count($this->game_board[0]);
			
			set_time_limit(60);
			
			// Main match loop.
			while (true)
			{
				$this->socket_write($this->player_turn, ('turn:' . $this->player_turn . "\n"));
				$move = $this->socket_read($this->player_turn, 32);
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
			
			die();
		}
		
		private function validate_player_move($move)
		{
			// Split move into row[0] and column[1].
			$move = explode(':', $move);
			
			if (2 == count($move))
			{
				// Make sure the player's move is an int.
				$move[0] = intval($move[0]);
				$move[1] = intval($move[1]);
				
				// Validate the player's move.
				if ($move[0] > -1 && $move[0] < $this->grid_size[0])
				{
					if ($move[1] > -1 && $move[1] < $this->grid_size[1])
					{
						// Check if another player already took the slot.
						if (-1 === $this->game_board[$move[0]][$move[1]])
						{
							set_time_limit(60);
							
							// Set the selected slot to the player's id.
							$this->game_board[$move[0]][$move[1]] = $this->player_turn;
							
							// Inform other players of the user's move.
							$this->socket_write_all('move:' . $this->player_turn . ':' . $move[0] . ':' . $move[1] . "\n");
							
							// Check if player has won.
							$this->turns_passed++;
							if ($this->turns_passed >= $this->turns_required_to_win)
							{
								$this->check_if_player_has_won($move);
							}
							
							// Start next player's turn.
							$this->player_turn++;
							if ($this->player_turn === count($this->player_sockets))
							{
								$this->player_turn = 0;
							}
							
							set_time_limit(60);
							return;
						}
					}
				}
			}
			
			// Invalid move, tell player to try again.
			$this->socket_write($this->player_turn, ('turn:' . $this->player_turn . "\n"));
		}
		
		private function check_if_player_has_won($move)
		{
			// Col.
			$slot_count = 1;
			if ($move[0] > 0)
			{
				for ($i = ($move[0] - 1); $i > -1; $i--)
				{
					if ($this->player_turn === $this->game_board[$i][$move[1]])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			if ($move[0] < ($this->grid_size[0] - 1))
			{
				for ($i = ($move[0] + 1); $i < $this->grid_size[0]; $i++)
				{
					if ($this->player_turn === $this->game_board[$i][$move[1]])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			
			// Row.
			$slot_count = 1;
			if ($move[1] > 0)
			{
				for ($i = ($move[1] - 1); $i > -1; $i--)
				{
					if ($this->player_turn === $this->game_board[$move[0]][$i])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			if ($move[1] < ($this->grid_size[1] - 1))
			{
				for ($i = ($move[1] + 1); $i < $this->grid_size[1]; $i++)
				{
					if ($this->player_turn === $this->game_board[$move[0]][$i])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			
			// Diagonal 1.
			$slot_count = 1;
			if ($move[0] > 0 && $move[1] < ($this->grid_size[1] - 1))
			{
				for ($i = ($move[0] - 1), $x = ($move[1] + 1); $i > -1 && $x < $this->grid_size[1]; $i--, $x++)
				{
					if ($this->player_turn === $this->game_board[$i][$x])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			if ($move[0] < ($this->grid_size[0] - 1) && $move[1] > 0)
			{
				for ($i = ($move[0] + 1), $x = ($move[1] - 1); $i < $this->grid_size[0] && $x > -1; $i++, $x--)
				{
					if ($this->player_turn === $this->game_board[$i][$x])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			
			// Diagonal 2.
			$slot_count = 1;
			if ($move[0] > 0 && $move[1] > 0)
			{
				for ($i = ($move[0] - 1), $x = ($move[1] - 1); $i > -1 && $x > -1; $i--, $x--)
				{
					if ($this->player_turn === $this->game_board[$i][$x])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
			if ($move[0] < ($this->grid_size[0] - 1) && $move[1] < ($this->grid_size[1] - 1))
			{
				for ($i = ($move[0] + 1), $x = ($move[1] + 1); $i < $this->grid_size[0] && $x < $this->grid_size[1]; $i++, $x++)
				{
					if ($this->player_turn === $this->game_board[$i][$x])
					{
						$slot_count++;
					}
					else
					{
						break;
					}
					if ($slot_count === $this->slots_to_win)
					{
						$this->socket_write_all('w:' . $this->player_turn . "/n");
						$this->end_match();
					}
				}
			}
		}
		
		private function socket_write($player_id, $data)
		{
			// Send data to given socket and check if successful.
			if (false === socket_write($this->player_sockets[$player_id], $data, strlen($data)))
			{
				// Inform other users of disconnected player.
				for ($i = 0; $i < count($this->player_sockets); $i++)
				{
					socket_write($this->player_sockets[$i], 'error:4' . "\n");
				}
				
				$this->end_match();
			}
		}
		
		private function socket_write_all($data)
		{
			for ($i = 0; $i < count($this->player_sockets); $i++)
			{
				$this->socket_write($i, $data);
			}
		}
		
		private function socket_read($player_id, $length)
		{
			// Send data to given socket and check if successful.
			if (false === ($result = socket_read($this->player_sockets[$player_id], $length, PHP_NORMAL_READ)))
			{
				// Inform other users of disconnected player.
				for ($i = 0; $i < count($this->player_sockets); $i++)
				{
					socket_write($this->player_sockets[$i], 'error:4' . "\n");
				}
				
				$this->end_match();
			}
			
			sec_database::log_user_action($this->player_sockets[$player_id], $result);
			return $result;
		}
	}
