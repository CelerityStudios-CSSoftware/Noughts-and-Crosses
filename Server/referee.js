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
            this.game.gameBoard.isCoordInBounds(x, y)
            && this.game.gameBoard.isSlotEmpty(x, y)
        );
    }

    canAnyoneWinYet() {
        logger.logDebug("[Debug]\nTurns: current " + (this.game.turnsPassed + 1) + " needed " + config.game.slotsToWin);
        return this.game.turnsPassed + 1 >= config.game.slotsToWin;
    }

    isWinningMove(x, y) {
        const paired_axes = [
            [[0,  1], [ 0, -1]],
            [[1,  0], [-1,  0]],
            [[1,  1], [-1, -1]],
            [[1, -1], [-1,  1]]
        ];
        const slotsToWin = config.game.slotsToWin;
        const currentPlayer = this.game.playerTurn;
        const board = this.game.gameBoard;
        logger.logDebug("[Debug]\nSlots to win: " + slotsToWin + " current player: " + currentPlayer);
        return paired_axes.some(function (axis) {
            let slotsInARow = 1;
            return axis.some(function (xStep, yStep) {
                let it = board.getIterator(x, y, xStep, yStep);
                while (
                    it.next() !== it.end()
                    && currentPlayer === board.getSlot(it.x, it.y)
                ) {
                    slotsInARow += 1;
                    if (slotsInARow === slotsToWin) {
                        logger.logDebug("[Debug]\n Winning move!")
                        return true;
                    }
                }
                return false;
            });
        });
    }
}

module.exports = Referee;
