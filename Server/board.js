/*jslint node*/

const defaultSlotValue = -1;

class BoardIterator {
    constructor(x, y, xStep, yStep, board) {
        this.x = x;
        this.y = y;
        this.xStep = xStep;
        this.yStep = yStep;
        this.board = board;
    }

    end() {
        return null;
    }

    next() {
        let nX = this.x + this.xStep;
        let nY = this.y + this.yStep;
        if (this.board.isCoordInBounds(nX, nY)) {
            this.x = nX;
            this.y = nY;
            return this;
        }
        return this.end();
    }
}

class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.slots = Array(height).fill().map(() => Array(width).fill(defaultSlotValue));
    }

    getSlot(x, y) {
        return this.slots[y][x];
    }

    setSlot(x, y, value) {
        this.slots[y][x] = value;
    }

    isSlotEmpty(x, y) {
        return this.slots[y][x] === defaultSlotValue;
    }

    isCoordInBounds(x, y) {
        return (
            x >= 0 && x < this.width
            && y >= 0 && y < this.height
        );
    }

    getIterator(x, y, xStep, yStep) {
        return new BoardIterator(x, y, xStep, yStep, this);
    }

    toString() {
        return this.slots.map(function (row) {
            return row.map(function (slot) {
                return (slot >= 0 ? " " : "") + slot;
            }).join(", ");
        }).join("\n");
    }
}

module.exports = Board;
