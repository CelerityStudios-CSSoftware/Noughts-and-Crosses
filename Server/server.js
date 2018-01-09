/*jslint node*/

"use strict";

// Contains running game instances.
let games = [];

// Contains required Node.js modules.
const include = {
    net: require("net")
};

// Contains all application constants.
const config = require("./config");

const logger = require("./logger");

// Main application logic.
const controller = (function () {
    let newController = {};

    newController.server = {
        // Contains server object.
        base: include.net.createServer({
            allowHalfOpen: config.server.allowHalfOpen,
            pauseOnConnect: config.server.pauseOnConnect
        }),

        // Configure and start the server.
        configure: function () {
            // Add new game instance for matchmaking.
            games.push(newController.createGame());

            newController.server.base.on("error", newController.events.server.onError);
            newController.server.base.on("connection", newController.events.server.onConnection);

            newController.server.base.maxConnections = config.server.maxConnections;

            newController.server.base.listen({
                host: config.server.host,
                port: config.server.port,
                backlog: config.server.backlog,
                exclusive: config.server.exclusive
            });

            // Print details of the servers configuration.
            logger.log("----- Server Started -----", "\nHost: ", config.server.host, "\nPort: ", config.server.port, "\nBacklog: ", config.server.backlog, "\nExclusive: ", config.server.exclusive, "\nMax connections: ", config.server.maxConnections);
        }
    };

    newController.generateRandomNumber = function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    newController.generateId = function () {
        let id = "";
        let l = "abcdefghijklmnopqrstuvwxyz";
        let n = "0123456789";

        let i = 0;
        while (i < config.game.connectionIdLength) {
            if (0 === newController.generateRandomNumber(0, 1)) {
                id += l[newController.generateRandomNumber(0, 25)];
            } else {
                id += n[newController.generateRandomNumber(0, 9)];
            }
            i += 1;
        }

        return id;
    };

    // Creates and returns a new game instance.
    newController.createGame = function () {
        let newGame = {};

        newGame.isMatchmaking = true;
        newGame.playerSockets = [];
        newGame.playerTurn = 0;
        newGame.turnsPassed = 0;
        newGame.playerTurnTimeout = {};
        newGame.disconnectedPlayerIds = [];
        newGame.gameBoard = (function () {
            let gameBoard = [];

            let r = 0;
            let c = 0;
            // Build the game board.
            while (r <= config.game.boardMaxRowColIndexes[0]) {
                // Add row to game board.
                gameBoard.push([]);

                // Add columns to row.
                while (c <= config.game.boardMaxRowColIndexes[1]) {
                    gameBoard[r].push(-1);
                    c += 1;
                }
                c = 0;
                r += 1;
            }

            return gameBoard;
        }());

        newGame.startGame = function () {
            newGame.playerSockets.forEach(function (socket, index) {
                // Inform players the game has started and give them their ID.
                newGame.socketWrite(socket, config.socket.codes.startGame, index);
            });

            newGame.isMatchmaking = false;
            // Inform players of new turn.
            newGame.socketWriteAll(config.socket.codes.playerTurn, newGame.playerTurn);
            newGame.startTurnTimeout();
        };

        newGame.validateMove = function (moveRow, moveCol) {
            // Parse packet data as an int.
            moveRow = parseInt(moveRow, 10);
            moveCol = parseInt(moveCol, 10);

            // Check if packet data is an int.
            if (true === Number.isInteger(moveRow) && true === Number.isInteger(moveCol)) {
                // Check if player's row move is within board bounds.
                if (moveRow >= 0 && moveRow <= config.game.boardMaxRowColIndexes[0]) {
                    // Check if player's column move is within board bounds.
                    if (moveCol >= 0 && moveCol <= config.game.boardMaxRowColIndexes[1]) {
                        // Check if board slot is already taken.
                        if (newGame.gameBoard[moveRow][moveCol] === -1) {
                            return true;
                        }
                    }
                }
            }

            // Inform player his move was invalid and to try again.
            newGame.socketWrite(newGame.playerSockets[newGame.playerTurn], config.socket.codes.playerTurn, newGame.playerTurn);
            return false;
        };

        newGame.applyPlayerMove = function (moveRow, moveCol) {
            // Assign board slot to player.
            newGame.gameBoard[moveRow][moveCol] = newGame.playerTurn;
            // Inform players of user's move.
            newGame.socketWriteAll(config.socket.codes.playerMoved, moveRow, moveCol);
        };

        newGame.checkIfPlayerCanWin = function () {
            // Check if enough turns have passed to win.
            newGame.turnsPassed += 1;
            return (newGame.turnsPassed >= config.game.turnsNeededToWin);
        };

        newGame.checkIfPlayerWon = function (moveRow, moveCol) {
            let r;
            let c;

            let slotsInARow = 1;
            if (moveRow > 0) {
                r = moveRow;

                while (r > 0) {
                    r -= 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][moveCol]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveRow < config.game.boardMaxRowColIndexes[0]) {
                r = moveRow;

                while (r < config.game.boardMaxRowColIndexes[0]) {
                    r += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][moveCol]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            slotsInARow = 1;
            if (moveCol > 0) {
                c = moveCol;

                while (c > 0) {
                    c -= 1;

                    if (newGame.playerTurn === newGame.gameBoard[moveRow][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveCol < config.game.boardMaxRowColIndexes[1]) {
                c = moveCol;

                while (c < config.game.boardMaxRowColIndexes[1]) {
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[moveRow][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            slotsInARow = 1;
            if (moveRow > 0 && moveCol < config.game.boardMaxRowColIndexes[1]) {
                r = moveRow;
                c = moveCol;

                while (r > 0 && c < config.game.boardMaxRowColIndexes[1]) {
                    r -= 1;
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveCol > 0 && moveRow < config.game.boardMaxRowColIndexes[0]) {
                r = moveRow;
                c = moveCol;

                while (c > 0 && r < config.game.boardMaxRowColIndexes[0]) {
                    r += 1;
                    c -= 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            slotsInARow = 1;
            if (moveRow > 0 && moveCol > 0) {
                r = moveRow;
                c = moveCol;

                while (r > 0 && c > 0) {
                    r -= 1;
                    c -= 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveRow < config.game.boardMaxRowColIndexes[0] && moveCol < config.game.boardMaxRowColIndexes[1]) {
                r = moveRow;
                c = moveCol;

                while (r < config.game.boardMaxRowColIndexes[0] && c < config.game.boardMaxRowColIndexes[1]) {
                    r += 1;
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === config.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }
        };

        newGame.nextTurn = function () {
            // Set next player's turn.
            newGame.playerTurn += 1;
            if (newGame.playerTurn >= config.game.playersPerGame) {
                newGame.playerTurn = 0;
            }

            // check if player is connected.
            let x = 0;
            while (x < 1) {
                if (newGame.disconnectedPlayerIds[newGame.playerTurn][0] === 1) {
                    newGame.playerTurn += 1;
                    if (newGame.playerTurn >= config.game.playersPerGame) {
                        newGame.playerTurn = 0;
                    }

                    // Check if next player is connected.
                    x += -1;
                }
                x += 1;
            }

            // Inform players of next user's turn.
            newGame.socketWriteAll(config.socket.codes.playerTurn, newGame.playerTurn);
        };

        newGame.endGame = function () {
            newGame.socketWriteAll(config.socket.codes.endGame);

            // Close all player sockets.
            newGame.playerSockets.forEach(function (socket) {
                socket.pause();
                socket.end();
            });

            // Remove game instance.
            let gameIndex = games.indexOf(newGame);
            games[gameIndex] = undefined;
            games.splice(gameIndex, 1);
        };

        newGame.socketWrite = function (socket, ...data) {
            // Format packet data and send to selected socket.
            data = data.join(config.socket.codes.dataSeparator) + config.socket.codes.endLine;
            try {
                socket.write(data);
            } catch (ex) {
                logger.logError(ex);
            }
        };

        newGame.socketWriteAll = function (...data) {
            newGame.playerSockets.forEach(function (socket) {
                newGame.socketWrite(socket, ...data);
            });
        };

        newGame.startTurnTimeout = function () {
            newGame.playerTurnTimeout = setTimeout(newGame.events.game.turnTimedOut, config.game.turnTimeout);
        };

        newGame.resetTurnTimeout = function () {
            // Reset player move timeout.
            clearTimeout(newGame.playerTurnTimeout);
            newGame.playerTurnTimeout = setTimeout(newGame.events.game.turnTimedOut, config.game.turnTimeout);
        };

        newGame.events = {
            game: {
                turnTimedOut: function () {
                    // Inform players a user took too long to move.
                    newGame.socketWriteAll(config.socket.codes.playerTurnTimeout);
                    newGame.endGame();
                }
            },

            socket: {
                onError: function (error) {
                    logger.logError(error);
                }
            }
        };

        newGame.messageHandlers = (function () {
            let handlers = {};

            handlers.handleMove = function (playerId, args) {
                let [x, y] = args;

                if (playerId !== newGame.playerTurn || true === newGame.isMatchmaking || false === newGame.validateMove(x, y)) {
                    return;
                }

                newGame.applyPlayerMove(x, y);
                if (true === newGame.checkIfPlayerCanWin()) {
                    let endGameReason;
                    if (true === newGame.checkIfPlayerWon(x, y)) {
                        endGameReason = config.socket.codes.playerWon;
                    } else if (newGame.turnsPassed === config.game.maxPossibleTurns) {
                        endGameReason = config.socket.codes.playerDraw;
                    }
                    if (undefined !== endGameReason) {
                        newGame.socketWriteAll(endGameReason, playerId);
                        newGame.endGame();
                        return;
                    }
                }
                newGame.nextTurn();
                newGame.resetTurnTimeout();
            };

            handlers.handleConcede = function () {
            };

            // This needs to be after the functions it puts in the table because
            // it takes the objects property value *at that point in time* at
            // which the table is declared which would be undefined if the
            // functions weren't yet declared.
            handlers.functionsForCodes = (function () {
                let table = {};
                table[config.socket.codes.playerMoved] = [handlers.handleMove, 2];
                table[config.socket.codes.playerLeft] = [handlers.handleConcede, 0];
                return table;
            }());

            handlers.handleMessage = function (code, playerId, args) {
                if (undefined !== handlers.functionsForCodes[code]) {
                    logger.log("Message of type " + code + " received. args: " + args.join(":"));
                    let [handler, argCount] = handlers.functionsForCodes[code];
                    if (argCount === args.length) {
                        handler(playerId, args);
                    } else {
                        logger.logError("Incorrect arg count. Message type " + code + " expects " + argCount + ", received " + args.length);
                    }
                }
            };

            return handlers;
        }());

        return newGame;
    };

    newController.events = {
        server: {
            onError: function (error) {
                logger.logError(error);
            },

            onConnection: function (socket) {
                // Get the matchmaking game instance.
                let newGameIndex = games.length - 1;
                let newGame = games[newGameIndex];

                // Give the player's socket an ID.
                socket.info = {
                    id: newGame.playerSockets.length
                };

                let cid = newController.generateId();
                newGame.disconnectedPlayerIds.push([0, cid]);
                newGame.socketWrite(socket, config.socket.codes.connectionId, cid);

                logger.log(
                    "Player connected from " + socket.remoteAddress + ":"
                    + socket.remotePort + " putting in game " + newGameIndex
                    + " as player " + socket.info.id
                );

                socket.on("error", newGame.events.socket.onError);
                socket.on("data", function (data) {
                    // Remove whitespace at the start and end of the data
                    data = data.trim();
                    // Parse package data into array.
                    data = data.split(config.socket.codes.dataSeparator);
                    newGame.messageHandlers.handleMessage(data[0], socket.info.id, data.splice(1));
                });
                socket.on("close", function () {
                    logger.log(
                        "Player " + socket.info.id + " disconnected from "
                        + socket.remoteAddress + ":" + socket.remotePort
                        + " in game " + newGameIndex
                    );

                    // Remove the player socket that has left.
                    newGame.playerSockets.splice(socket.info.id, 1);

                    if (true === newGame.isMatchmaking) {
                        newGame.disconnectedPlayerIds.splice(socket.info.id, 1);

                        // Inform players of new user count.
                        newGame.socketWriteAll(config.socket.codes.playerFound, newGame.playerSockets.length, config.game.playersPerGame);
                    } else if (false === newGame.isMatchmaking) {
                        newGame.disconnectedPlayerIds[socket.info.id][0] = 1;

                        // Inform players a user has disconnected.
                        newGame.socketWriteAll(config.socket.codes.playerLeft, socket.info.id, 0);

                        if (2 > newGame.playerSockets.length) {
                            newGame.endGame();
                        }
                    }
                });

                socket.setEncoding(config.socket.encoding);
                socket.setKeepAlive(config.socket.keepAlive, config.socket.keepAliveInitialDelay);
                socket.setNoDelay(config.socket.noDelay);
                socket.setTimeout(config.socket.timeout);

                // Add the player's socket to the game instance.
                newGame.playerSockets.push(socket);
                // Inform players a new user has joined.
                newGame.socketWriteAll(config.socket.codes.playerFound, newGame.playerSockets.length, config.game.playersPerGame);

                // Check if required amount of players have joined.
                if (newGame.playerSockets.length === config.game.playersPerGame) {
                    newGame.startGame();
                    // Add new game instance for matchmaking.
                    games.push(newController.createGame());
                }
            }
        }
    };

    return newController;
}());

// Configure and start the server.
controller.server.configure();
