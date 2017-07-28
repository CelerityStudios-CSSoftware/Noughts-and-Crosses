<?php
	require_once 'match.php';
	
	$matchmaking = new matchmaking();
	$match = new match();
	
	$matchmaking->start();
	
	class matchmaking
	{
		/*
		 * The player_id var
		 * is the zero based index value
		 * of the player's socket in the player_sockets var.
		 *
		 * Error Code 1: Failed to create main listening socket.
		 * Error Code 2: Failed to bind socket.
		 * Error Code 3: Failed to start listening socket.
		 *
		 * Error Code 5: Failed to fork process.
		 */
		
		private $ip_address = '132.148.22.175';
		private $port = 1413;
		
		private $socket;
		// Max players allowed per match.
		private $player_limit = 2;
		// Contains player sockets for next match.
		private $player_sockets = [];
		
		public function start()
		{
			error_reporting(E_ALL);
			set_time_limit(0);
			ob_implicit_flush();
			
			// Setup matchmaking socket listener.
			if (false === ($this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)))
			{
				die('error:1');
			}
			elseif (false === socket_bind($this->socket, $this->ip_address, $this->port))
			{
				die('error:2');
			}
			elseif (false === socket_listen($this->socket, 1))
			{
				die('error:3');
			}
			
			self::listen();
		}
		
		private function listen()
		{
			while (true)
			{
				// Add the connected player to next match group.
				array_push($this->player_sockets, socket_accept($this->socket));
				
				self::matchmake();
			}
		}
		
		private function matchmake()
		{
			$player_count = count($this->player_sockets);
			
			// Check if match still needs more players.
			if ($player_count < $this->player_limit)
			{
				// Inform others of joined player.
				self::socket_write_all('pf:' . $player_count . ':' . $this->player_limit . "\n");
			}
			elseif (count($this->player_sockets) === $this->player_limit)
			{
				socket_close($this->socket);
				
				global $match;
				$match->player_sockets = $this->player_sockets;
				$this->player_sockets = [];
				$match->start();
			}
		}
		
		private function socket_write($player_id, $data)
		{
			// Send data to given socket and check if successful.
			if (false === socket_write($this->player_sockets[$player_id], $data, strlen($data)))
			{
				// Remove disconnected player from matchmaking.
				array_splice($this->player_sockets, $player_id, 1);
				return false;
			}
			return true;
		}
		
		private function socket_write_all($data)
		{
			$players_disconnected = 0;
			do
			{
				$player_count = count($this->player_sockets);
				
				// Check if "do" is in 2nd loop.
				if (0 < $players_disconnected)
				{
					// Inform other users of disconnected player.
					$data = 'pd:' . $player_count . ':' . $this->player_limit . "\n";
					
					// Prevent "do" from looping again.
					$players_disconnected = 0;
				}
				
				// Send messages to players backwards,
				// in case self::socket_write splices a player from the array.
				$player_id = $player_count - 1;
				for ($i = 0; $i < $player_count; $i++, $player_id--)
				{
					// Check if player has disconnected.
					if (false === self::socket_write($player_id, $data))
					{
						// Prepare "do" to loop, to inform others of disconnected player.
						$players_disconnected++;
					}
				}
			}
			while (0 < $players_disconnected);
		}
	}