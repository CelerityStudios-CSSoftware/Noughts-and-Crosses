"use strict";

const logger = require("./logger")

const MatchHandlers = {
    handleMove: function(player, x, y) {
        logger.logDebug("Handling move");
        if (player.id !== this.currentTurn) return;
        if (this.isMatchmaking === true) return;
        if (this.referee.isMoveValid(x, y) === false) {
            logger.logWarning("Invalid move " + x + ":" + y + " by player " + player.id);
            return;
        }
        this.applyMove(player, x, y);
    },

    handleConcede: function(player) {
        return player;
    }
};

module.exports = MatchHandlers;
