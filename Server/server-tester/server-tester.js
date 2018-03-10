"use strict"

const Director = require('./director');
const Parser = require('./parser');

if (process.argv.length > 2) {
    const parser = new Parser();
    for (let i = 2; i < process.argv.length; i++) {
        const path = process.argv[i];
        const script = parser.parse_asm_file(path);
        console.log("###################################");
        console.log("Running '" + path + "'");
        console.log("###################################");
        const director = new Director();
        director.run_script(script);
    }
    setTimeout(() => {
        process.exit();
    }, 200);
} else {
    console.log("No file provided as argument. Doing nothing... Done.");
}
