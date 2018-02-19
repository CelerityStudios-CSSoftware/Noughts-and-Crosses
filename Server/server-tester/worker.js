"use strict"

const net = require('net');
const wait = require('wait-for-stuff');

class Worker {
    constructor() {
        this.socket = new net.Socket();
        this.connected = false;
    }

    connect(server, port) {
        this.socket.connect(port, server, () => this.connected = true);
        this._set_up_handlers();
    }

    is_connected() {
        return this.connected;
    }

    disconnect() {
        this.socket.end();
    }

    send_message(message) {
        this.socket.write(message);
    }

    expect_message(message, timeout = 5000) {
        let message_found = false;
        const check_message = (data) => {
            if (data == message) {
                message_found = true;
            }
        };
        this.socket.on("data", check_message);
        wait.for.predicate(() => message_found);
        this.socket.removeListener("data", check_message);
    }

    _set_up_handlers() {
        const disconnect = _ => { this.connected = false; }
        this.socket.on("data", (data) => { console.log("Received '" + String(data).replace(/\n$/, "") + "' from server"); });
        this.socket.on("close", disconnect);
        this.socket.on("error", error => {
            console.log(error.name + ':' + error.message);
        });
        this.socket.on("end", disconnect);
    }
}

module.exports = Worker;
