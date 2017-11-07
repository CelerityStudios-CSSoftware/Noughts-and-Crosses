"use strict";

let games = [];

const include = {
    net: require("net")
};

const model = {
    server: {
        // comments to explain some of these would be welcome
        allowHalfOpen: false, // what is half open?
        pauseOnConnect: false, // what is paused on connect?

        maxConnections: 5000,

        host: "127.0.0.1",
        port: 12345,
        backlog: 50, // what's the backlog?
        exclusive: true // what does exclusive mean?
    },

    socket: {
        encoding: "utf8",
        keepAlive: false,
        keepAliveInitialDelay: 0,
        noDelay: true,
        timeout: 0,

        codes: {
            dataSeparator: ":",
            endLine: "\n",

            startGame: "s",

            playerFound: "f",
            playerLeft: "pl",

            playerTurn: "t",
            playerTurnTimeout: "to",
            playerMoved: "m",
            playerDraw: "pd",
            playerWon: "w"
        }
    },

    game: {
        playersPerGame: 2,

        slotsToWin: 3,
        turnsNeededToWin: 5,
        maxPossibleTurns: 9,
        turnTimeout: 30000,

        // that board is 3x3. either this var is named wrong and actually
        // represents maximum indices for each dimension or you should set
        // it to [3, 3]
        boardSize: [2, 2],
        // do you have to manually create the gameBoard even though the size is given?
        gameBoard: [
            [-1, -1, -1],
            [-1, -1, -1],
            [-1, -1, -1]
        ]
    }
};

const controller = (function () {
    let newController = {};

    newController.server = {
        base: include.net.createServer({
            allowHalfOpen: model.server.allowHalfOpen,
            pauseOnConnect: model.server.pauseOnConnect
        }),

        configure: function () {
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

            console.log("----- Server Started -----", "\nHost: ", model.server.host, "\nPort: ", model.server.port, "\nBacklog: ", model.server.backlog, "\nExclusive: ", model.server.exclusive, "\nMax connections: ", model.server.maxConnections);
        }
    };

    newController.createGame = function () {
        let newGame = {};

        newGame.isActive = false;
        newGame.playerSockets = [];
        newGame.playerTurn = 0;
        newGame.turnsPassed = 0;
        newGame.playerTurnTineout = {};
        newGame.gameBoard = (function () {
            let gameBoard = [];

            model.game.gameBoard.forEach(function (row) {
                gameBoard.push(row.slice(0)); // isn't row.slice(0) the same as row?
            });

            return gameBoard;
        }());

        newGame.startGame = function () {
            newGame.playerSockets.forEach(function (socket, index) {
                socket.pause(); // doesn't this override the pauseOnConnect parameter? since you pause it anyway?
                newGame.socketWrite(socket, model.socket.codes.startGame, index);
            });

            newGame.isActive = true;
            newGame.playerSockets[0].resume(); // only the first player is unpaused?
            newGame.socketWriteAll(model.socket.codes.playerTurn, newGame.playerTurn);
            // tiNeout? :)
            newGame.playerTurnTineout = setTimeout(newGame.events.game.turnTimedOut, model.game.turnTimeout);
        };

        // this function does too much
        // I think it would be better to have a validateMove function that
        // returns true or false and then an applyMove function that applies
        // the move
        newGame.validateMove = function (moveRow, moveCol) {
            moveRow = parseInt(moveRow, 10);
            moveCol = parseInt(moveCol, 10);

            if (true === Number.isInteger(moveRow) && true === Number.isInteger(moveCol)) {
                if (moveRow >= 0 && moveRow <= model.game.boardSize[0]) {
                    if (moveCol >= 0 && moveCol < model.game.boardSize[1]) {
                        if (newGame.gameBoard[moveRow][moveCol] === -1) {
                            newGame.gameBoard[moveRow][moveCol] = this.playerTurn;
                            newGame.socketWriteAll(model.socket.codes.playerMoved, moveRow, moveCol);

                            newGame.turnsPassed += 1;
                            if (newGame.turnsPassed >= model.game.turnsNeededToWin) {
                                if (true === newGame.checkIfPlayerWon(moveRow, moveCol)) {
                                    newGame.socketWriteAll(model.socket.codes.playerWon, newGame.playerTurn);
                                    newGame.endGame();
                                    return;
                                }
                                if (newGame.turnsPassed === model.game.maxPossibleTurns) {
                                    newGame.socketWriteAll(model.socket.codes.playerDraw, newGame.playerTurn);
                                    newGame.endGame();
                                    return;
                                }
                            }

                            newGame.playerTurn += 1;
                            if (newGame.playerTurn === model.game.playersPerGame) {
                                newGame.playerTurn = 0;
                            }
                            newGame.playerSockets[newGame.playerTurn].resume();
                            newGame.socketWriteAll(model.socket.codes.playerTurn, newGame.playerTurn);

                            clearTimeout(newGame.playerTurnTineout);
                            newGame.playerTurnTineout = setTimeout(newGame.events.game.turnTimedOut, model.game.turnTimeout);
                            return;
                        }
                    }
                }
            }

            newGame.socketWrite(newGame.playerSockets[newGame.playerTurn], model.socket.codes.playerTurn, newGame.playerTurn);
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

            if (moveRow < model.game.boardSize[0]) {
                r = moveRow;

                while (r < model.game.boardSize[0]) {
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

            if (moveCol < model.game.boardSize[1]) {
                c = moveCol;

                while (c < model.game.boardSize[1]) {
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
            if (moveRow > 0 && moveCol < model.game.boardSize[1]) {
                r = moveRow;
                c = moveCol;

                while (r > 0 && c < model.game.boardSize[1]) {
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

            if (moveCol > 0 && moveRow < model.game.boardSize[0]) {
                r = moveRow;
                c = moveCol;

                while (c > 0 && r < model.game.boardSize[0]) {
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

            if (moveRow < model.game.boardSize[0] && moveCol < model.game.boardSize[1]) {
                r = moveRow;
                c = moveCol;

                while (r < model.game.boardSize[0] && c < model.game.boardSize[1]) {
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

        newGame.endGame = function () {
            newGame.playerSockets.forEach(function (socket) {
                socket.pause();
                socket.end();
            });

            let gameIndex = games.indexOf(newGame);
            games[gameIndex] = undefined;
            games.splice(gameIndex, 1);
        };

        newGame.socketWrite = function (socket, ...data) {
            data = data.join(model.socket.codes.dataSeparator) + model.socket.codes.endLine;
            socket.write(data);
        };

        newGame.socketWriteAll = function (...data) {
            newGame.playerSockets.forEach(function (socket) {
                newGame.socketWrite(socket, ...data);
            });
        };

        newGame.events = {
            game: {
                turnTimedOut: function () {
                    newGame.socketWriteAll(model.socket.codes.playerTurnTimeout);
                    newGame.endGame();
                }
            },

            socket: {
                onError: function (error) {
                    console.error(error);
                },

                onData: function (data) {
                    if (true === newGame.isActive) {
                        newGame.playerSockets[newGame.playerTurn].pause();

                        data = data.split(model.socket.codes.dataSeparator);
                        if (data[0] === model.socket.codes.playerMoved) {
                            newGame.validateMove(data[1], data[2]);
                        } else {
                            newGame.playerSockets[newGame.playerTurn].resume();
                        }
                    }
                },

                onClose: function () {
                    if (false === newGame.isActive) {
                        newGame.playerSockets.forEach(function (socket, index) {
                            if (true === socket.destroyed) {
                                newGame.playerSockets.splice(index, 1);
                            }
                        });

                        newGame.socketWriteAll(model.socket.codes.playerFound, newGame.playerSockets.length, model.game.playersPerGame);
                    } else if (true === newGame.isActive) {
                        newGame.playerSockets.forEach(function (socket, index) {
                            if (true === socket.destroyed) {
                                newGame.playerSockets.splice(index, 1);
                            }
                        });

                        newGame.socketWriteAll(model.socket.codes.playerLeft);
                        newGame.endGame();
                    }
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
                let newGame = games[games.length - 1];

                newGame.playerSockets.push(socket);

                socket.on("error", newGame.events.socket.onError);
                socket.on("data", newGame.events.socket.onData);
                socket.on("close", newGame.events.socket.onClose);

                socket.setEncoding(model.socket.encoding);
                socket.setKeepAlive(model.socket.keepAlive, model.socket.keepAliveInitialDelay);
                socket.setNoDelay(model.socket.noDelay);
                socket.setTimeout(model.socket.timeout);

                newGame.socketWriteAll(model.socket.codes.playerFound, newGame.playerSockets.length, model.game.playersPerGame);

                if (newGame.playerSockets.length === model.game.playersPerGame) {
                    newGame.startGame();
                    games.push(newController.createGame());
                }
            }
        }
    };

    return newController;
}());

controller.server.configure();
