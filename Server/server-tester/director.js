"use strict"

const MachineResources = require('./machine-resources');
const Server = require('../new-server');
const myserv = new Server();

class Director {
    constructor() {
        this.mr = new MachineResources();

        this.run_script = (script) => {
            myserv.start();
            const opcodes_to_commands = new Map([
                ["NW",  [1,  this.mr.new_worker]],
                ["WC",  [1,  this.worker_connect]],
                [">",   [2,  this.send_message]],
                ["<",   [2,  this.expect_message]],
                ["KW",  [1,  this.mr.kill_worker]]
            ]);

            script.forEach(cmd => {
                const [opcode, ...argv] = cmd;
                const command = opcodes_to_commands.get(opcode);
                //try {
                    if (command === undefined) {
                        throw "Invalid opcode: '" + opcode + "'";
                    }
                    const [argc, func] = command;
                    if (argv.length !== argc) {
                        throw "Invalid argument count: '" + opcode + "' expects " + argc + " arguments, " + argv.length + " provided";
                    }
                    func(...argv);
                //} catch(e) {
                //     console.log("-> '" + cmd.join(" ") + "'\n");
                //     console.log("Stacktrace:\n" + e.stack);
                //     throw "Aborted script run."
                // }
            });
            myserv.shutdown();
        };

        this.worker_connect = (id) => {
            const worker = this.mr.get_worker(id);
            worker.connect("127.0.0.1", 12345);
        };

        this.send_message = (id, message) => {
            const worker = this.mr.get_worker(id);
            worker.send_message(message);
        };

        this.expect_message = (id, message) => {
            const worker = this.mr.get_worker(id);
            worker.expect_message(message);
        };
    }
}

// const script = [
//     ["NW",  "1"],
//     ["WC",  "1"],
//     [">",   "1", "plork"],
//     ["<",   "1", "f:1:2"],
//     ["KW",  "1"]
// ];

module.exports = Director;
