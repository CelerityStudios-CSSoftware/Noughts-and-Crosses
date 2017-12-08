"use strict";

// Contains all application constants.
const config = {
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

            // Used to reconnect player.
            connectionId: "cid",

            // Signals start of game.
            startGame: "s",
            // Signals the game has to end.
            endGame: "eg",

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

    game: (function () {
        let game = {};

        // Id length used for reconnection.
        game.connectionIdLength = 8;
        // Maximum zero base index of board's rows and columns.
        game.boardMaxRowColIndexes = [2, 2];
        // Players required for a game to start.
        game.playersPerGame = 2;
        // Required slots in a row to win.
        game.slotsToWin = 3;
        // Minimum required turns to win (based on slots to win).
        game.turnsNeededToWin = (game.playersPerGame * game.slotsToWin) - (game.playersPerGame - 1);
        // Maximum possible turns (based on size of the board and players.).
        game.maxPossibleTurns = (game.boardMaxRowColIndexes[0] * game.boardMaxRowColIndexes[1]) + 2;
        // Milliseconds before a turn times out.
        game.turnTimeout = 30000;

        return game;
    }())
};

module.exports = config;