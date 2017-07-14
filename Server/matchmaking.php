<?php
	require_once 'match.php';
	
	matchmaking::start();
	
	class matchmaking
	{
		private static $ip_address = '127.0.0.1';
		
		private static $port = 1413;
		
		private static $socket;
		
		// Contains players for next match.
		private static $player_sockets = [];
		
		public static function start()
		{
			error_reporting(0);
			set_time_limit(0);
			ob_implicit_flush();
			
			// Setup matchmaking socket listener.
			if (false === (self::$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)))
			{
				die('error:');
			}
			elseif (false === socket_bind(self::$socket, self::$ip_address, self::$port))
			{
				die('error:');
			}
			elseif (false === socket_listen(self::$socket, 5))
			{
				die('error:');
			}
			
			self::listen();
		}
		
		private static function listen()
		{
			while (true)
			{
				echo 'NO';
				// Add the connected player to next match group.
				array_push(self::$player_sockets, socket_accept(self::$socket));
				
				self::matchmake();
			}
		}
		
		// Documentation coming soon.
		private static function matchmake()
		{
			if (1 === count(self::$player_sockets))
			{
				self::socket_write(0, "Server:matchmaking...\n");
			}
			elseif (2 === count(self::$player_sockets))
			{
				if (false !== self::socket_write(1, "Server:matchmaking...\n"))
				{
					if (false !== self::socket_write(0, "Server:Player found.\n"))
					{
						if (false === self::socket_write(1, "Server:Player found.\n"))
						{
							self::socket_write(0, "Server:Player disconnected.\nServer: matchmaking...\n");
						}
						else
						{
							$match = new match();
							$match->player_sockets[0] = self::$player_sockets[0];
							$match->player_sockets[1] = self::$player_sockets[1];
							$match->start();
							
							self::$player_sockets = [];
							echo 'hello';
						}
					}
				}
			}
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
	}