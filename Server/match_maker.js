"use strict";

const Lobby = require('./lobby');
const logger = require('./logger');

class MatchMaker {
    constructor() {
        this.lobbies = [];
        this.matches = new Map();

        this.newPlayer = player => {
            let lobbyIndex = this.lobbies.findIndex(l => !l.isFull());
            if (lobbyIndex === -1) {
                this.lobbies.push(new Lobby());
                lobbyIndex = this.lobbies.length - 1;
            }
            this.lobbies[lobbyIndex].addPlayer(player);
            logger.logDebug("Lobby #" + lobbyIndex + " has " + this.lobbies[lobbyIndex].players.size + " players");
            if (this.lobbies[lobbyIndex].isFull()) {
                logger.logDebug("Lobby #" + lobbyIndex + " is full")
                this.convertLobbyToMatch(lobbyIndex);
            }
        };

        this.convertLobbyToMatch = lobbyIndex => {
            const lobby = this.lobbies.splice(lobbyIndex, 1)[0];
            const match = lobby.convertToMatch();
            this.matches.set(match.id, match);
            match.on("end", m => {
                this.matches.delete(m.id);
                logger.log("Match with id '" + m.id + "' ended.");
            });
            match.start();
        };

        this.reconnectPlayer = (player, mId, cId) => {
            if (this.matches.has(mId)) {
                const match = this.matches.get(mId);
                if (match.hasPlayer(cId)) {
                    match.reconnectPlayer(cId, player);
                    return;
                }
            }
            player.sendMessage("handshakeFailed");
        };
    }
}

module.exports = MatchMaker;
