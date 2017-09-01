/*jslint node:true*/
var require = {
    net: require('net')
};

var model = {
    server: {
        allowHalfOpen: false,
        pauseOnConnect: true,
        maxConnections: 5000,
        port: 12345,
        host: 'localhost',
        backlog: 50,
        exclusive: true
    },
    
    socket: {
        encoding: 'utf8',
        keepAlive: false,
        keepAliveInitialDelay: 0,
        noDelay: true,
        timeout: 60000,
        codes: {
            playerFound: 'f',
            startGame: 's',
            playerTurn: 't',
            playerLeftInGame: 'pl',
            playerWon: 'w'
        }
    },
    
    game: {
        playersPerGame: 2,
        slotsToWin: 3,
        turnsToWin: 5,
        gridSize: [3, 3]
    }
};

var controller = {
    server: {
        base: require.net.createServer({
            allowHalfOpen: model.server.allowHalfOpen,
            pauseOnConnect: model.server.pauseOnConnect
        }),
        
        configure: function () {
            'use strict';
            controller.games.push(new controller.game());
            
            controller.server.base.maxConnections = model.server.maxConnections;
            
            controller.server.base.on('error', controller.server.onError);
            controller.server.base.on('connection', controller.server.onConnection);
            
            controller.server.base.listen({
                port: model.server.port,
                host: model.server.host,
                backlog: model.server.backlog,
                exclusive: model.server.exclusive
            });
        },
        
        onError: function (error) {
            'use strict';
            console.error('Error: ', error);
        },
        
        onConnection: function (socket) {
            'use strict';
            var newGame = controller.games.length - 1,
                playerCount = controller.games[newGame].playerSockets.length + 1;
            
            socket.on('error', controller.games[newGame].onError);
            socket.on('close', controller.games[newGame].onClose);
            
            socket.setEncoding(model.socket.encoding);
            socket.setKeepAlive(model.socket.keepAlive, model.socket.keepAliveInitialDelay);
            socket.setNoDelay(model.socket.noDelay);
            socket.setTimeout(model.socket.timeout);
            
            if (playerCount === model.game.playersPerGame) {
                controller.games.push(new controller.game());
                
                controller.games[newGame].playerSockets.push(socket);
                controller.games[newGame].start();
            } else if (playerCount < model.game.playersPerGame) {
                controller.games[newGame].playerSockets.push(socket);
                controller.games[newGame].socketWriteAll(model.socket.codes.playerFound + ':' + playerCount + '/' + model.game.playersPerGame);
            }
        }
    },
    
    game: function () {
        'use strict';
        this.matchmaking = true;
        this.closing = false;
        this.playerSockets = [];
        this.playerTurn = 0;
        this.turnsPassed = 0;
        this.gameBoard = [
            [-1, -1, -1],
            [-1, -1, -1],
            [-1, -1, -1]
        ];
        
        this.start = function () {
            var i;
            
            this.matchmaking = false;
            
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.socketWrite(i, model.socket.codes.startGame + ':' + i);
            }
        };
        
        this.checkIfPlayerWon = function (move) {
            var i, x, slotCount;
            
			slotCount = 1;
			if (move[0] > 0) {
				for (i = (move[0] - 1); i > -1; i -= 1) {
					if (this.playerTurn === this.gameBoard[i][move[1]]) {
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
			if (move[0] < (this.model.game.gridSize[0] - 1)) {
				for (i = (move[0] + 1); i < this.model.game.gridSize[0]; i += 1) {
					if (this.playerTurn === this.gameBoard[i][move[1]]) {
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
			if (move[1] > 0) {
				for (i = (move[1] - 1); i > -1; i -= 1) {
					if (this.playerTurn === this.gameBoard[move[0]][i]) {
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
			if (move[1] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[1] + 1); i < this.model.game.gridSize[1]; i += 1) {
					if (this.playerTurn === this.gameBoard[move[0]][i]) {
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
			if (move[0] > 0 && move[1] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[0] - 1), x = (move[1] + 1); i > -1 && x < this.model.game.gridSize[1]; i -= 1, x += 1) {
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
			if (move[0] < (this.model.game.gridSize[0] - 1) && move[1] > 0) {
				for (i = (move[0] + 1), x = (move[1] - 1); i < this.model.game.gridSize[0] && x > -1; i += 1, x -= 1) {
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
			if (move[0] > 0 && move[1] > 0) {
				for (i = (move[0] - 1), x = (move[1] - 1); i > -1 && x > -1; i -= 1, x -= 1) {
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
			if (move[0] < (this.model.game.gridSize[0] - 1) && move[1] < (this.model.game.gridSize[1] - 1)) {
				for (i = (move[0] + 1), x = (move[1] + 1); i < this.model.game.gridSize[0] && x < this.model.game.gridSize[1]; i += 1, x += 1) {
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
        
        this.endGame = function () {
            var i;
            
            this.closing = true;
            
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.playerSockets[i].end();
            }
            
            controller.games.splice(controller.games.indexOf(this), 1);
        };
        
        this.socketWrite = function (socketIndex, data) {
            this.playerSockets[socketIndex].write(data);
        };
        
        this.socketWriteAll = function (data) {
            var i;
            for (i = 0; i < this.playerSockets.length; i += 1) {
                this.playerSockets[i].write(data);
            }
        };
        
        this.onError = function (error) {
            console.error('Error: ', error);
        };
        
        this.onClose = function (hasError) {
            if (true === this.matchmaking) {
                var i,
                    playerCount = this.playerSockets.length;
                
                for (i = 0; i < playerCount; i += 1) {
                    if (this.playerSockets[i] === undefined) {
                        this.playerSockets.splice(i, 1);
                    }
                }
                
                playerCount = this.playerSockets.length;
                if (playerCount > 0) {
                    this.socketWriteAll(model.socket.codes.playerFound + ':' + playerCount + '/' + model.game.playersPerGame);
                }
            } else if (false === this.closing) {
                this.closing = true;
                this.socketWriteAll(model.socket.codes.playerLeftInGame);
                this.endGame();
            }
        };
    },
    
    games: []
};

controller.server.configure();