/*jslint node:true*/

// Required Node.js modules.
var require = {
    net: require('net')
};

// Const used by the controller.
var model = {
    // Vars used in the server controller.
    server: {
        allowHalfOpen: false,
        
        pauseOnConnect: true,
        
        maxConnections: 5000,
        
        port: 12345,
        
        host: 'localhost',
        
        backlog: 50,
        
        exclusive: true
    },
    
    // Vars used for socket communication.
    socket: {
        encoding: 'utf8',
        
        keepAlive: false,
        
        keepAliveInitialDelay: 0,
        
        noDelay: true,
        
        timeout: 60000,
        
        // Shorthands for game events.
        codes: {
            playerFound: 'f',
            
            startGame: 's',
            
            playerTurn: 't',
            
            playerMoved: 'm',
            
            playerTimedOut: 'to',
            
            playerLeftInGame: 'pl',
            
            playerWon: 'w'
        }
    },
    
    // Vars used in the game controller.
    game: {
        playersPerGame: 2,
        
        slotsToWin: 3,
        
        turnsToWin: 5,
        
        gridSize: [3, 3]
    }
};

// Main application code.
var controller = {
    // Server logic.
    server: {
        // The server object.
        base: require.net.createServer({
            allowHalfOpen: model.server.allowHalfOpen,
            pauseOnConnect: model.server.pauseOnConnect
        }),
        
        // Configure and start server.
        configure: function () {
            'use strict';
            // Create first game instance.
            controller.games.push(new controller.game());
            
            // Limit the amount of connections to the server.
            controller.server.base.maxConnections = model.server.maxConnections;
            
            // Add server event handlers.
            controller.server.base.on('error', controller.server.onError);
            controller.server.base.on('connection', controller.server.onConnection);
            
            // Create port listener.
            controller.server.base.listen({
                port: model.server.port,
                host: model.server.host,
                backlog: model.server.backlog,
                exclusive: model.server.exclusive
            });
        },
        
        // Handle server error.
        onError: function (error) {
            'use strict';
            console.error('Error: ', error);
        },

        // Handle socket when new player connects.
        onConnection: function (socket) {
            'use strict';
            var newGame = controller.games.length - 1,
                playerCount = controller.games[newGame].playerSockets.length + 1;

            // Add socket event handlers.
            socket.on('error', controller.games[newGame].onError);
            socket.on('data', controller.games[newGame].onData);
            socket.on('close', controller.games[newGame].onClose);

            // Configure socket.
            socket.setEncoding(model.socket.encoding);
            socket.setKeepAlive(model.socket.keepAlive, model.socket.keepAliveInitialDelay);
            socket.setNoDelay(model.socket.noDelay);
            socket.setTimeout(model.socket.timeout);

            // Check if required amount of players have joined.
            if (playerCount === model.game.playersPerGame) {
                // Add last player and start game.
                controller.games[newGame].playerSockets.push(socket);
                controller.games[newGame].start();

                // Create next game instance.
                controller.games.push(new controller.game());
            } else if (playerCount < model.game.playersPerGame) {
                // Add new player to game.
                controller.games[newGame].playerSockets.push(socket);
                // Inform users of how many players still needed to start.
                controller.games[newGame].socketWriteAll(model.socket.codes.playerFound + ':' + playerCount + ':' + model.game.playersPerGame);
            }
        }
    },
    
    // Game instance constructor.
    game: function () {
        'use strict';
        this.matchmaking = true;
        
        this.playerSockets = [];
        
        this.playerTurn = 0;
        
        this.turnsPassed = 0;
        
        this.gameBoard = [
            [-1, -1, -1],
            [-1, -1, -1],
            [-1, -1, -1]
        ];
        
        // Setup and start game.
        this.start = function () {
            var i;
            
            this.matchmaking = false;
            
            // Tell players the game has started
            // and inform them of their socket's index.
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.socketWrite(i, model.socket.codes.startGame + ':' + i);
            }
            
            // Start listening for player move.
            this.playerSockets[0].resume();
            // Set player move timeout.
            setTimeout(this.onTimeout, 60000);
        };
        
        // Validate the current player's move.
        this.validateMove = function (move) {
            // Check move array is correct length.
            if (3 === move.length) {
                // Convert player's move (Row 1, Col 2) to a integer.
                move[1] = parseInt(move[1], 10);
                move[2] = parseInt(move[2], 10);
                
                // Check player's move is an integer.
                if (true === Number.isInteger(move[1]) && true === Number.isInteger(move[2])) {
                    // Check moves are within the grid size.
                    if (-1 < move[1] && move[1] < model.game.gridSize[0]) {
                        if (-1 < move[2] && move[2] < model.game.gridSize[1]) {
                            // Check if slot has already been taken.
                            if (-1 === this.gameBoard[move[1]][move[2]]) {
                                // Assign slot to current player.
                                this.gameBoard[move[1]][move[2]] = this.playerTurn;
                                
                                // Inform other users of the player's move.
                                this.socketWriteAll(model.socket.codes.playerMoved + ':' + move[1] + ':' + move[2]);
                                
                                // Check if player won.
                                this.turnsPassed += 1;
                                if (this.turnsPassed >= model.game.turnsToWin) {
                                    this.checkIfPlayerWon(move);
                                }
                                
                                // Start next player's turn.
                                this.playerTurn += 1;
                                if (this.playerTurn === model.game.playersPerGame) {
                                    this.playerTurn = 0;
                                }
                                
                                // Inform players of next turn.
                                this.socketWriteAll(model.socket.codes.playerTurn + ':' + this.playerTurn);
                                // Set player move timeout.
                                setTimeout(this.onTimeout, 60000);
                                
                                return;
                            }
                        }
                    }
                }
            }
            // Invalid move, tell player to try again.
            this.socketWrite(this.playerTurn, model.socket.codes.playerTurn + ':' + this.playerTurn);
        };
        
        // Check if the current player has won.
        this.checkIfPlayerWon = function (move) {
            var i, x, slotCount;
            
			slotCount = 1;
			if (0 < move[1]) {
				for (i = (move[1] - 1); i > -1; i -= 1) {
					if (this.playerTurn === this.gameBoard[i][move[2]]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			if (move[1] < (this.model.game.gridSize[0] - 1)) {
				for (i = (move[1] + 1); i < this.model.game.gridSize[0]; i += 1) {
					if (this.playerTurn === this.gameBoard[i][move[2]]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			
			slotCount = 1;
			if (0 < move[2]) {
				for (i = (move[2] - 1); i > -1; i -= 1) {
					if (this.playerTurn === this.gameBoard[move[1]][i]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			if (move[2] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[2] + 1); i < this.model.game.gridSize[1]; i += 1) {
					if (this.playerTurn === this.gameBoard[move[1]][i]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			
			slotCount = 1;
			if (0 < move[1] && move[2] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[1] - 1), x = (move[2] + 1); i > -1 && x < this.model.game.gridSize[1]; i -= 1, x += 1) {
					if (this.playerTurn === this.gameBoard[i][x]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			if (move[1] < (this.model.game.gridSize[0] - 1) && 0 < move[2]) {
				for (i = (move[1] + 1), x = (move[2] - 1); i < this.model.game.gridSize[0] && x > -1; i += 1, x -= 1) {
					if (this.playerTurn === this.gameBoard[i][x]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			
			slotCount = 1;
			if (0 < move[1] && 0 < move[2]) {
				for (i = (move[1] - 1), x = (move[2] - 1); i > -1 && x > -1; i -= 1, x -= 1) {
					if (this.playerTurn === this.gameBoard[i][x]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
			if (move[1] < (this.model.game.gridSize[0] - 1) && move[2] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[1] + 1), x = (move[2] + 1); i < this.model.game.gridSize[0] && x < this.model.game.gridSize[1]; i += 1, x += 1) {
					if (this.playerTurn === this.gameBoard[i][x]) {
						slotCount += 1;
					} else {
						break;
					}
					if (slotCount === model.game.slotsToWin) {
						this.socketWriteAll(model.socket.codes.playerWon + ':' + this.playerTurn);
						this.endGame();
					}
				}
			}
        };
        
        // Close sockets and end game.
        this.endGame = function () {
            var i;
            
            // Close all player sockets.
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.playerSockets[i].end();
            }
            
            // Remove game from memory.
            controller.games.splice(controller.games.indexOf(this), 1);
        };
        
        // Send data to a specific player socket by array index.
        this.socketWrite = function (socketIndex, data) {
            this.playerSockets[socketIndex].write(data);
        };
        
        // Send data to all players.
        this.socketWriteAll = function (data) {
            var i;
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.playerSockets[i].write(data);
            }
        };
        
        // Handle socket error.
        this.onError = function (error) {
            console.error('Error: ', error);
        };

        // Handle incoming player data.
        this.onData = function (data) {
            this.playerSockets[this.playerTurn].pause();
            
            // Convert data to array for reading.
            data = data.split(':');
            // Validate the current player's move.
            this.validateMove(data);
            
            this.playerSockets[this.playerTurn].resume();
        };
        
        // Handle player move timeout.
        this.onTimeout = function () {
            // Inform users a player timed out.
            this.socketWriteAll(model.socket.codes.playerTimedOut);
            this.endGame();
        };

        // Handle disconnected player.
        this.onClose = function (hasError) {
            // Check if player left during matchmaking.
            if (true === this.matchmaking) {
                var i,
                    playerCount = this.playerSockets.length;

                // Find and remove dead player sockets.
                for (i = 0; i < playerCount; i += 1) {
                    if (this.playerSockets[i] === undefined) {
                        this.playerSockets.splice(i, 1);
                    }
                }

                // Check if there are still players matchmaking.
                playerCount = this.playerSockets.length;
                if (0 < playerCount) {
                    // Inform users of leaving players.
                    this.socketWriteAll(model.socket.codes.playerFound + ':' + playerCount + ':' + model.game.playersPerGame);
                }

                // Check if player left mid game.
            } else {
                // Inform users of leaving players and end game.
                this.socketWriteAll(model.socket.codes.playerLeftInGame);
                this.endGame();
            }
        };
    },
    
    // Array of active game instances.
    games: []
};

// Configure and start server.
controller.server.configure();