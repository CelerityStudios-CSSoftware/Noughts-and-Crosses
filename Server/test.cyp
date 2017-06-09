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
	elseif (socket_connect($socket, $address, $port) === false)
	{
		echo 'Failed to connect to socket.';
	}
	else
	{
		$msg = 'Testing 1 2 3.';
		socket_write($socket, $msg, strlen($msg));
		
		$msg = 'Shutdown';
		socket_write($socket, $msg, strlen($msg));
	}
	
	socket_close($socket);