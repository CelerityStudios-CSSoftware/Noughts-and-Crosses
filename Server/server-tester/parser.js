"use strict"

const fs = require('fs');

class Parser {
    constructor() {
        this.parse_asm = (asm) => {
            const lines = String(asm).split(/\r?\n/).filter(x => x !== "");
            return lines.map(l => l.split(" "));
        };

        this.parse_asm_file = (path) => {
            const contents = fs.readFileSync(path);
            return this.parse_asm(contents);
        };
    }
}

module.exports = Parser;
