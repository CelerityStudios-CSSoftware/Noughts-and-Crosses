"use strict";

const events = require('events');
const Board = require('./board');
const Referee = require('./referee');
const IdGenerator = require('./id_generator')
const playerMessageHandlers = require('./match_message_handlers');
const config = require('./config');
const logger = require('./logger');

// Emits "end" events when the match ends
class Match {
    constructor() {
        this.id = IdGenerator.generateId();
        this.players = [];
        this.currentTurn = 0;
        this.turnsPassed = 0;
        this.disconnectedPlayers = [];
        this.turnTimer = null;
        this.eventEmitter = new events.EventEmitter();

        const boardDimensions = config.game.boardMaxRowColIndexes;
        this.board = new Board(boardDimensions[1] + 1, boardDimensions[0] + 1);
        this.referee = new Referee().watchGame(this);
        this.handlers = playerMessageHandlers;

        this.addPlayer = pl => {
            pl.id = this.players.length;
            logger.logDebug("Added player to match '" + this.id + "' with id '" + pl.id + "' and cid '" + pl.cid + "'")
            this.players.push(pl);
            this.addPlayerListeners(pl);
        };

        this.start = () => {
            this.players.forEach((pl) => {
                pl.sendMessage("gameStarted", pl.id);
            });
            logger.logDebug("Game started");
            this.startTurn();
        };

        this.startTurn = () => {
            this.broadcast("playerTurn", this.currentTurn);
            // TODO re-enabled turn timeouts
            // if (this.turnTimer !== null) clearTimeout(this.turnTimer);
            // const baseTimeout = config.game.turnTimeout;
            // const timeoutMultiplier = this.players[this.currentTurn].timeoutMultiplier;
            // const timeout = baseTimeout * timeoutMultiplier;
            // this.turnTimer = setTimeout(this.handleTurnTimedOut, timeout);
            // logger.logDebug("Turn started, turn timer was reset");
        };

        // this.handleTurnTimedOut = () => {
        //
        // };

        this.applyMove = (player, x, y) => {
            this.board.setSlot(x, y, player.id);
            this.broadcast("playerMove", x, y);
            this.checkForEndOfGame(player, x, y);
            logger.logDebug("board state:\n" + this.board.toString());
            this.endTurn();
            this.startTurn();
        };

        this.checkForEndOfGame = (player, x, y) => {
            if (this.referee.canAnyoneWinYet() === false) return;
            if (this.referee.isWinningMove(player.id, x, y) === true) {
                this.broadcast("playerWon", player.id);
            } else if (this.turnsPassed == config.game.maxPossibleTurns) {
                this.broadcast("draw", player.id);
            } else {
                return;
            }
            this.end();
        };

        this.endTurn = () => {
            // TODO refactor this to account for gaps in player ids
            this.currentTurn = (this.currentTurn + 1) % this.players.length;
            if (this.currentTurn == 0) this.turnsPassed += 1;
        };

        this.broadcast = (msgType, ...args) => {
            this.players.forEach(pl => pl.sendMessage(msgType, ...args));
        };

        this.end = () => {
            this.broadcast("endGame");
            this.players.forEach(pl => pl.mute());
            this.eventEmitter.emit("end", this);
        };

        ////////////////////////////
        // Message handling logic //
        ////////////////////////////
        this.playerMessageHandlers = ((() => {
            const codes = config.socket.codes;
            const table = new Map([
                ["playerMove", [this.handlers.handleMove,      2]],
                ["playerLeft", [this.handlers.handleConcede,   0]]
            ]);
            return table;
        })());

        this.addPlayerListeners = (player) => {
            this.playerMessageHandlers.forEach((value, key, _) => {
                const [handler, argCount] = value;
                logger.logDebug("Registered message '" + key + "' for player '" + player.cid + " with expected argcount of " + argCount);
                player.onMessage(key, (...args) => {
                    if (args.length == argCount) {
                        handler.call(this, player, ...args);
                    } else {
                        logger.logWarning("Incorrect arg count. Message type " + key + " expects " + argCount + ", received " + args.length);
                    }
                });
            });
        };

        //////////////////////////
        // Event handling logic //
        //////////////////////////
        this.on = (msg, cb) => this.eventEmitter.on(msg, cb);
        this.removeListener = (msg, cb) => this.eventEmitter.removeListener(msg, cb);
    }
}

module.exports = Match;
