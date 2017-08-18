<?php
	class sec_database
	{
		private const host = '';
		private const database = '';
		
		private const username = '';
		private const password = '';
		
		private static $pdo;
		private static $stmt;
		
		public static function connect()
		{
			self::$pdo = new PDO('mysql:host=' . self::host . ';dbname=' . self::database, self::username, self::password);
			self::configure();
		}
		
		public static function disconnect()
		{
			self::$stmt = null;
			self::$pdo = null;
		}
		
		private static function configure()
		{
			self::$pdo->setAttribute(PDO::ATTR_CASE, PDO::CASE_LOWER);
			self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			self::$pdo->setAttribute(PDO::ATTR_ORACLE_NULLS, PDO::NULL_TO_STRING);
			self::$pdo->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, false);
			self::$pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);
			self::$pdo->setAttribute(PDO::ATTR_AUTOCOMMIT, false);
			self::$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
			self::$pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
			self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
		}
		
		public static function log_user_action($socket, $action)
		{
			socket_getpeername($socket, $ip_address);
			$date = date('Y-m-d H:i:s');
			
			if (FALSE !== filter_var($ip_address, FILTER_VALIDATE_IP))
			{
				if (self::$stmt === null)
				{
					self::$stmt = self::$pdo->prepare('INSERT INTO user_logs (ip_address, action, date) VALUES (:ip_address, :action, :date)');
					self::$stmt->bindParam(':ip_address', $ip_address, PDO::PARAM_STR);
					self::$stmt->bindParam(':action', $action, PDO::PARAM_STR);
					self::$stmt->bindParam(':date', $date, PDO::PARAM_STR);
				}
				
				self::$stmt->execute();
			}
		}
	}
