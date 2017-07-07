<?php
	require_once 'game.php';
	listener::start();
	
	class listener
	{
		const ip_address = '127.0.0.1';
		const port = 1413;
		
		private static $socket;
		private static $players = [];
		
		public static function start()
		{
			error_reporting(E_ALL);
			set_time_limit(0);
			ob_implicit_flush();
			
			try
			{
				if (false === (self::$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)))
				{
					throw new Exception('1');
				}
				elseif (false === socket_bind(self::$socket, self::ip_address, self::port))
				{
					throw new Exception('2');
				}
				elseif (false === socket_listen(self::$socket, 5))
				{
					throw new Exception('3');
				}
				
				self::listen();
			}
			catch (Exception $e)
			{
				echo $e->getMessage();
			}
		}
		
		private static function listen()
		{
			try
			{
				while (true)
				{
					if (false === array_push(self::$players, socket_accept(self::$socket)))
					{
						throw new Exception('4');
					}
					
					self::matchmake();
				}
			}
			catch (Exception $e)
			{
				echo $e->getMessage();
			}
		}
		
		private static function matchmake()
		{
			if (1 === count(self::$players))
			{
				self::player_write(0, "Server: matchmaking...\n");
			}
			elseif (2 === count(self::$players))
			{
				if (false !== self::player_write(1, "Server: matchmaking...\n"))
				{
					if (false !== self::player_write(0, "Server: Player found.\n"))
					{
						if (false === self::player_write(1, "Server: Player found.\n"))
						{
							self::player_write(0, "Server: Player disconnected.\nServer: matchmaking...\n");
						}
						else
						{
							$game = new game();
							$game->players[0] = self::$players[0];
							$game->players[1] = self::$players[1];
							$game->start();
							
							self::$players = [];
							self::listen();
						}
					}
				}
			}
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