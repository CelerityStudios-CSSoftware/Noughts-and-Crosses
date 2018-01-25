/*jslint node*/

const config = require("./config");

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
        return this.game.turnsPassed >= config.game.turnsNeededToWin;
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
        return paired_axes.some(function (axis) {
            let slotsInARow = 1;
            return axis.some(function (xStep, yStep) {
                let it = this.game.gameBoard.getIterator(x, y, xStep, yStep);
                while (
                    it.next() !== it.end()
                    && currentPlayer === this.game.gameBoard.getSlot(it.x, it.y)
                ) {
                    slotsInARow += 1;
                    if (slotsInARow === slotsToWin) {
                        return true;
                    }
                }
                return false;
            });
        });
    }
}

module.exports = Referee;
