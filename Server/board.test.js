const Board = require('./board');

test("Creating a 3 x 2 board gives the right dimensions", function () {
    let b = new Board(3, 2);
    expect(b.width).toBe(3);
    expect(b.height).toBe(2);
    expect(b.slots.length).toBe(2);
    expect(b.slots[0].length).toBe(3);
});

test("Getting the bottom right slot of a 4 x 5 board works", function () {
    let b = new Board(4, 5);
    expect(b.getSlot(3, 4)).toBe(-1);
});

test("Setting the top left slot of a 2 x 2 board works", function () {
    let b = new Board(2, 2);
    b.setSlot(0, 0, 4);
    expect(b.slots[0][0]).toBe(4);
});

test("toString returns an accurate representation of the board", function () {
    let b = new Board(2, 3);
    b.setSlot(1, 0, 3);
    b.setSlot(0, 1, 2);
    expect(b.toString()).toBe("-1,  3\n 2, -1\n-1, -1");
});

test("I can use a boardIterator to go from the bottom left to the top right", function () {
    let b = new Board(3, 3);
    let it = b.getIterator(0, 0, 1, 1);
    let nextIt;
    [
        [0, 0],
        [1, 1],
        [2, 2]
    ].forEach(function (coord) {
        expect(it.x).toBe(coord[0]);
        expect(it.y).toBe(coord[1]);
        nextIt = it.next();
    });
    expect(nextIt).toBe(it.end());
});
