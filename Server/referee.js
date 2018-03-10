/*jslint node*/

const config = require("./config");
const logger = require("./logger")

class Referee {
    constructor() {
        this.game = null;
    }

    watchGame(game) {
        this.game = game;
        return this;
    }

    isMoveValid(x, y) {
        return (
            this.game.board.isCoordInBounds(x, y)
            && this.game.board.isSlotEmpty(x, y)
        );
    }

    canAnyoneWinYet() {
        logger.logDebug("Turns: current " + (this.game.turnsPassed + 1) + " needed " + config.game.slotsToWin);
        return this.game.turnsPassed + 1 >= config.game.slotsToWin;
    }

    isWinningMove(playerId, x, y) {
        const paired_axes = [
            [[0,  1], [ 0, -1]],
            [[1,  0], [-1,  0]],
            [[1,  1], [-1, -1]],
            [[1, -1], [-1,  1]]
        ];
        const slotsToWin = config.game.slotsToWin;
        const board = this.game.board;
        logger.logDebug("Slots to win: " + slotsToWin + " current player: " + playerId);
        return paired_axes.some(function (axis) {
            let slotsInARow = 1;
            return axis.some(function (xStep, yStep) {
                let it = board.getIterator(x, y, xStep, yStep);
                while (
                    it.next() !== it.end()
                    && playerId === board.getSlot(it.x, it.y)
                ) {
                    slotsInARow += 1;
                    if (slotsInARow === slotsToWin) {
                        logger.logDebug("Winning move!")
                        return true;
                    }
                }
                return false;
            });
        });
    }
}

module.exports = Referee;
