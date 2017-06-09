<?php
	error_reporting(E_ALL);
	set_time_limit(120);
	ob_implicit_flush();
	
	$address = '127.0.0.1';
	$port = 1413;
	$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
	
	if ($socket === false)
	{
		echo 'Failed to create socket.';
	}
	elseif (socket_bind($socket, $address, $port) === false)
	{
		echo 'Failed to bind socket.';
	}
	elseif (socket_listen($socket, 100) === false)
	{
		echo 'Failed to start socket listening.';
	}
	else
	{
		while (true)
		{
			$conn = socket_accept($socket);
			
			if ($conn === false)
			{
				echo 'Failed to accept socket connection.';
				break;
			}
			else
			{
				while (true)
				{
					$msg = socket_read($conn, 2048, PHP_NORMAL_READ);
					
					if ($msg === false)
					{
						echo 'Failed to read socket buffer.';
						break 2;
					}
					elseif (!$msg = trim($msg))
					{
						continue;
					}
					elseif ($msg === 'Shutdown')
					{
						echo 'Shutdown.';
						break 2;
					}
					
					echo 'Msg: ' . htmlentities($msg);
				}
			}
			
			socket_close($conn);
		}
	}
	
	socket_close($socket);