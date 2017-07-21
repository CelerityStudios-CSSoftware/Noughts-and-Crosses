<?php
	require_once 'match.php';
	
	$match = null;
	matchmaking::start();
	
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
		
		private static $ip_address = '127.0.0.1';
		
		private static $port = 1413;
		
		private static $socket;
		// Max players allowed per match.
		private static $player_limit = 2;
		// Contains player sockets for next match.
		private static $player_sockets = [];
		
		private static $matchmaking = true;
		
		public static function start()
		{
			error_reporting(E_ALL);
			set_time_limit(256);
			ob_implicit_flush();
			
			// Setup matchmaking socket listener.
			if (false === (self::$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)))
			{
				die('error:1');
			}
			elseif (false === socket_bind(self::$socket, self::$ip_address, self::$port))
			{
				die('error:2');
			}
			elseif (false === socket_listen(self::$socket, 5))
			{
				die('error:3');
			}
			
			self::listen();
		}
		
		private static function listen()
		{
			while (true === self::$matchmaking)
			{
				// Add the connected player to next match group.
				array_push(self::$player_sockets, socket_accept(self::$socket));
				
				self::matchmake();
			}
		}
		
		private static function matchmake()
		{
			$player_count = count(self::$player_sockets);
			
			// Check if match still needs more players.
			if ($player_count < self::$player_limit)
			{
				// Inform others of joined player.
				self::socket_write_all('pf:' . $player_count . ':' . self::$player_limit . "\n");
			}
			elseif (count(self::$player_sockets) === self::$player_limit)
			{
				$pid = pcntl_fork();
				
				if (-1 === $pid)
				{
					self::socket_write_all('error:5' . "\n");
					self::reboot();
				}
				elseif (1 === $pid)
				{
					self::$player_sockets = [];
				}
				else
				{
					self::$socket = null;
					self::$matchmaking = false;
					
					global $match;
					$match = new match();
					$match->player_sockets = self::$player_sockets;
					
					self::$player_sockets = [];
				}
			}
		}
		
		private static function reboot()
		{
			// Close all player sockets.
			foreach (self::$player_sockets as &$socket)
			{
				socket_close($socket);
			}
			self::$player_sockets = [];
		}
		
		private static function socket_write($player_id, $data)
		{
			// Send data to given socket and check if successful.
			if (false === socket_write(self::$player_sockets[$player_id], $data, strlen($data)))
			{
				// Remove disconnected player from matchmaking.
				array_splice(self::$player_sockets, $player_id, 1);
				return false;
			}
			return true;
		}
		
		private static function socket_write_all($data)
		{
			$players_disconnected = 0;
			do
			{
				$player_count = count(self::$player_sockets);
				
				// Check if "do" is in 2nd loop.
				if (0 < $players_disconnected)
				{
					// Inform other users of disconnected player.
					$data = 'pd:' . $player_count . ':' . self::$player_limit . "\n";
					
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
	
	if (null !== $match)
	{
		$match->start();
	}