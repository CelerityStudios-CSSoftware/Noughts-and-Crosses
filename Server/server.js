"use strict";

// Contains running game instances.
let games = [];

// Contains required Node.js modules.
const include = {
    net: require("net")
};

// Contains all application constants.
const model = {
    server: {
        allowHalfOpen: false,
        pauseOnConnect: false,

        maxConnections: 5000,

        host: "127.0.0.1",
        port: 12345,
        backlog: 50,
        exclusive: true
    },

    socket: {
        encoding: "utf8",
        keepAlive: false,
        keepAliveInitialDelay: 0,
        noDelay: true,
        timeout: 0,

        // Contains important characters used in socket packets.
        codes: {
            // Used to separate data.
            dataSeparator: ":",
            // Used to end packets.
            endLine: "\n",

            // Signals start of game.
            startGame: "s",

            // Signals a player has been found during matchmaking.
            playerFound: "f",
            // Signals a player has left the game.
            playerLeft: "pl",

            // Signals the next players turn.
            playerTurn: "t",
            // Signals the players turn has timed out.
            playerTurnTimeout: "to",
            // Signals a player's move.
            playerMoved: "m",
            // Signals a draw.
            playerDraw: "pd",
            // Signals a player has won.
            playerWon: "w"
        }
    },

    game: {
        // Players required for a game to start.
        playersPerGame: 2,

        // Required slots in a row to win.
        slotsToWin: 3,
        // Minimum required turns to win (based on slots to win).
        turnsNeededToWin: 5,
        // Maximum possible turns (based on size of the board and players.).
        maxPossibleTurns: 9,
        // Milliseconds before a turn times out.
        turnTimeout: 30000,

        // Maximum zero base index of board's rows and columns.
        boardMaxRowColIndexes: [2, 2]
    }
};

// Main application logic.
const controller = (function () {
    let newController = {};

    newController.server = {
        // Contains server object.
        base: include.net.createServer({
            allowHalfOpen: model.server.allowHalfOpen,
            pauseOnConnect: model.server.pauseOnConnect
        }),

        // Configure and start the server.
        configure: function () {
            // Add new game instance for matchmaking.
            games.push(newController.createGame());

            newController.server.base.on("error", newController.events.server.onError);
            newController.server.base.on("connection", newController.events.server.onConnection);

            newController.server.base.maxConnections = model.server.maxConnections;

            newController.server.base.listen({
                host: model.server.host,
                port: model.server.port,
                backlog: model.server.backlog,
                exclusive: model.server.exclusive
            });

            // Print details of the servers configuration.
            console.log("----- Server Started -----", "\nHost: ", model.server.host, "\nPort: ", model.server.port, "\nBacklog: ", model.server.backlog, "\nExclusive: ", model.server.exclusive, "\nMax connections: ", model.server.maxConnections);
        }
    };

    // Creates and returns a new game instance.
    newController.createGame = function () {
        let newGame = {};

        newGame.isMatchmaking = true;
        newGame.playerSockets = [];
        newGame.playerTurn = 0;
        newGame.turnsPassed = 0;
        newGame.playerTurnTineout = {};
        newGame.gameBoard = (function () {
            let gameBoard = [];

            let r = 0;
            let c = 0;
            // Build the game board.
            while (r <= model.game.boardMaxRowColIndexes[0]) {
                // Add row to game board.
                gameBoard.push([]);

                // Add columns to row.
                while (c <= model.game.boardMaxRowColIndexes[1]) {
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
                newGame.socketWrite(socket, model.socket.codes.startGame, index);
            });

            newGame.isMatchmaking = false;
            // Inform players of new turn.
            newGame.socketWriteAll(model.socket.codes.playerTurn, newGame.playerTurn);
            newGame.startTurnTimeout();
        };

        newGame.validateMove = function (moveRow, moveCol) {
            // Parse packet data as an int.
            moveRow = parseInt(moveRow, 10);
            moveCol = parseInt(moveCol, 10);

            // Check if packet data is an int.
            if (true === Number.isInteger(moveRow) && true === Number.isInteger(moveCol)) {
                // Check if player's row move is within board bounds.
                if (moveRow >= 0 && moveRow <= model.game.boardMaxRowColIndexes[0]) {
                    // Check if player's column move is within board bounds.
                    if (moveCol >= 0 && moveCol <= model.game.boardMaxRowColIndexes[1]) {
                        // Check if board slot is already taken.
                        if (newGame.gameBoard[moveRow][moveCol] === -1) {
                            return true;
                        }
                    }
                }
            }

            // Inform player his move was invalid and to try again.
            newGame.socketWrite(newGame.playerSockets[newGame.playerTurn], model.socket.codes.playerTurn, newGame.playerTurn);
            return false;
        };

        newGame.applyPlayerMove = function (moveRow, moveCol) {
            // Assign board slot to player.
            newGame.gameBoard[moveRow][moveCol] = newGame.playerTurn;
            // Inform players of user's move.
            newGame.socketWriteAll(model.socket.codes.playerMoved, moveRow, moveCol);
        };

        newGame.checkIfPlayerCanWin = function (moveRow, moveCol) {
            // Check if enough turns have passed to win.
            newGame.turnsPassed += 1;
            if (newGame.turnsPassed >= model.game.turnsNeededToWin) {
                if (true === newGame.checkIfPlayerWon(moveRow, moveCol)) {
                    // Inform players a user has won.
                    newGame.socketWriteAll(model.socket.codes.playerWon, newGame.playerTurn);
                    newGame.endGame();
                    return true;
                }
                if (newGame.turnsPassed === model.game.maxPossibleTurns) {
                    // Inform players of a draw.
                    newGame.socketWriteAll(model.socket.codes.playerDraw, newGame.playerTurn);
                    newGame.endGame();
                    return true;
                }
            }

            return false;
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

                        if (slotsInARow === model.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveRow < model.game.boardMaxRowColIndexes[0]) {
                r = moveRow;

                while (r < model.game.boardMaxRowColIndexes[0]) {
                    r += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][moveCol]) {
                        slotsInARow += 1;

                        if (slotsInARow === model.game.slotsToWin) {
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

                        if (slotsInARow === model.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveCol < model.game.boardMaxRowColIndexes[1]) {
                c = moveCol;

                while (c < model.game.boardMaxRowColIndexes[1]) {
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[moveRow][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === model.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            slotsInARow = 1;
            if (moveRow > 0 && moveCol < model.game.boardMaxRowColIndexes[1]) {
                r = moveRow;
                c = moveCol;

                while (r > 0 && c < model.game.boardMaxRowColIndexes[1]) {
                    r -= 1;
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === model.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveCol > 0 && moveRow < model.game.boardMaxRowColIndexes[0]) {
                r = moveRow;
                c = moveCol;

                while (c > 0 && r < model.game.boardMaxRowColIndexes[0]) {
                    r += 1;
                    c -= 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === model.game.slotsToWin) {
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

                        if (slotsInARow === model.game.slotsToWin) {
                            return true;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (moveRow < model.game.boardMaxRowColIndexes[0] && moveCol < model.game.boardMaxRowColIndexes[1]) {
                r = moveRow;
                c = moveCol;

                while (r < model.game.boardMaxRowColIndexes[0] && c < model.game.boardMaxRowColIndexes[1]) {
                    r += 1;
                    c += 1;

                    if (newGame.playerTurn === newGame.gameBoard[r][c]) {
                        slotsInARow += 1;

                        if (slotsInARow === model.game.slotsToWin) {
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
            if (newGame.playerTurn === model.game.playersPerGame) {
                newGame.playerTurn = 0;
            }
            // Inform players of next user's turn.
            newGame.socketWriteAll(model.socket.codes.playerTurn, newGame.playerTurn);
        };

        newGame.endGame = function () {
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

        newGame.socketWrite = function (socket, data) {
            // Format packet data and send to selected socket.
            data = data.join(model.socket.codes.dataSeparator) + model.socket.codes.endLine;
            socket.write(data);
        };

        newGame.socketWriteAll = function (...data) {
            newGame.playerSockets.forEach(function (socket) {
                newGame.socketWrite(socket, data);
            });
        };

        newGame.startTurnTimeout = function () {
            newGame.playerTurnTineout = setTimeout(newGame.events.game.turnTimedOut, model.game.turnTimeout);
        };

        newGame.resetTurnTimeout = function () {
            // Reset player move timeout.
            clearTimeout(newGame.playerTurnTineout);
            newGame.playerTurnTineout = setTimeout(newGame.events.game.turnTimedOut, model.game.turnTimeout);
        };

        newGame.events = {
            game: {
                turnTimedOut: function () {
                    // Inform players a user took too long to move.
                    newGame.socketWriteAll(model.socket.codes.playerTurnTimeout);
                    newGame.endGame();
                }
            },

            socket: {
                onError: function (error) {
                    console.error(error);
                }
            }
        };

        return newGame;
    };

    newController.events = {
        server: {
            onError: function (error) {
                console.error(error);
            },

            onConnection: function (socket) {
                // Get the matchmaking game instance.
                let newGame = games[games.length - 1];

                // Give the player's socket an ID.
                socket.info = {
                    id: newGame.playerSockets.length
                };

                socket.on("error", newGame.events.socket.onError);
                socket.on("data", function (data) {
                    if (socket.info.id === newGame.playerTurn && false === newGame.isMatchmaking) {
                        // Parse package data into array.
                        data = data.split(model.socket.codes.dataSeparator);
                        // Check if packet contains the player's move.
                        if (data[0] === model.socket.codes.playerMoved) {
                            if (true === newGame.validateMove(data[1], data[2])) {

                                newGame.applyPlayerMove(data[1], data[2]);

                                if (false === newGame.checkIfPlayerCanWin()) {
                                    newGame.nextTurn();
                                    newGame.resetTurnTimeout();
                                }
                            }
                        }
                    }
                });
                socket.on("close", function () {
                    // Remove the player socket that has left.
                    newGame.playerSockets.splice(socket.info.id, 1);

                    if (true === newGame.isMatchmaking) {
                        // Inform players of new user count.
                        newGame.socketWriteAll(model.socket.codes.playerFound, newGame.playerSockets.length, model.game.playersPerGame);
                    } else if (false === newGame.isMatchmaking) {
                        // Inform players a user has left.
                        newGame.socketWriteAll(model.socket.codes.playerLeft);
                        newGame.endGame();
                    }
                });

                socket.setEncoding(model.socket.encoding);
                socket.setKeepAlive(model.socket.keepAlive, model.socket.keepAliveInitialDelay);
                socket.setNoDelay(model.socket.noDelay);
                socket.setTimeout(model.socket.timeout);

                // Add the player's socket to the game instance.
                newGame.playerSockets.push(socket);
                // Inform players a new user has joined.
                newGame.socketWriteAll(model.socket.codes.playerFound, newGame.playerSockets.length, model.game.playersPerGame);

                // Check if required amount of players have joined.
                if (newGame.playerSockets.length === model.game.playersPerGame) {
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