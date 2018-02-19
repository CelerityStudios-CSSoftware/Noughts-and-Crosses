"use strict"

const Worker = require('./worker.js');

class Director {
    read_script(script) {
        return;
    }
}

const w = new Worker();
w.connect("127.0.0.1", 12345);

w.send_message("plork");
w.expect_message("f:1:2\n");
w.disconnect();
