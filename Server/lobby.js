"use strict";

const config = require('./config');
const Match = require('./match');
const IdGenerator = require('./id_generator')
const logger = require('./logger');

class Lobby {
    constructor() {
        this.id = IdGenerator.generateId();
        this.players = new Map();
        this.slots = config.game.playersPerGame;

        this.isFull = () => this.players.size >= this.slots;

        this.onPlayerDisconnect = player => {
            logger.log("Player '" + player.cid + "' left lobby '" + this.id + "'.");
            this.players.delete(player.cid);
            this.broadcastPlayerCount();
        };

        this.addPlayer = player => {
            logger.logDebug("Adding a player with id '" + player.cid + "' to lobby '" + this.id + "'")
            this.players.set(player.cid, player);
            this.broadcastPlayerCount();
            player.onMessage('disconnected', this.onPlayerDisconnect);
        };

        this.broadcastPlayerCount = () => {
            const args = [this.players.size, this.slots];
            this.broadcast("playerFound", ...args);
        }

        this.broadcast = (code, ...args) => {
            this.players.forEach(pl => pl.sendMessage(code, ...args));
        };

        this.convertToMatch = () => {
            const match = new Match();
            this.players.forEach(player => {
                player.removeListener('disconnected', this.onPlayerDisconnect);
                match.addPlayer(player);
            });
            return match;
        };
    }
}

module.exports = Lobby;
