"use strict"

const net = require('net');
const wait = require('wait-for-stuff');

const MessageBuffer = require('../message_buffer')

class Worker {
    constructor(id) {
        this.id = id;
        this.socket = new net.Socket();
        this.connected = false;
        this.message_buffer = new MessageBuffer();
        this.messages = [];

        const _set_up_handlers = () => {
            const disconnect = _ => { this.connected = false; }
            this.socket.on("data", data => { this.message_buffer.append(data); });
            this.message_buffer.add_listener(data => {
                this.messages.push(data);
                _log("Received '" + data + "' from server");
            });
            this.socket.on("close", disconnect);
            this.socket.on("error", error => {
                _log(error.name + ':' + error.message);
            });
            this.socket.on("end", disconnect);
        };

        const _log = message => console.log("#" + this.id + ": " + message);

        this.connect = (server, port) => {
            this.socket.connect(port, server, () => this.connected = true);
            _set_up_handlers();
        };

        this.is_connected = () => this.connected;

        this.disconnect = () => this.socket.end();

        this.send_message = message => {
            _log("Sending '" + message + "'")
            this.socket.write(message + "\n");
        };

        this.expect_message = (message, timeout = 2000) => {
            let message_found = false;
            const check_message = () => {
                while (this.messages.length > 0) {
                    const data = this.messages.shift();
                    if (data == message) {
                        message_found = true;
                        return true;
                    }
                }
                return false;
            };
            const start_time = Date.now();
            const is_time_up = () => Date.now() - start_time > timeout;
            _log("Expecting '" + message + "'");
            wait.for.predicate(() => (check_message() || is_time_up()));
            _log("Found expected message");
            this.message_buffer.remove_listener(check_message);
            if (message_found === false) {
                throw "Timed out waiting for message '" + message + "'";
            }
        };
    }
}

module.exports = Worker;
