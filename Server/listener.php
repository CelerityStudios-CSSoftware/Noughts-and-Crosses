<?php
	session_start();
	listener::start();
	
	class listener
	{
		private const ip_address = '127.0.0.1';
		private const port = 1413;
		
		private static $socket;
		private static $players = [];
		private static $ch;
		
		public static function start()
		{
			error_reporting(E_ALL);
			set_time_limit(0);
			ob_implicit_flush();
			
			$_SESSION['players'] = [];
			
			self::$ch = curl_init();
			curl_setopt(self::$ch, CURLOPT_URL, 'game.php');
			curl_setopt(self::$ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt(self::$ch, CURLOPT_TIMEOUT, 1);
			
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
							$_SESSION['players'][0] = self::$players[0];
							$_SESSION['players'][1] = self::$players[1];
							self::$players = [];
							
							curl_exec(self::$ch);
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