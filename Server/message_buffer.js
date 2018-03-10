const events = require('events');

class MessageBuffer {
    constructor() {
        this.buffer = "";
        this.messageEventEmitter = new events.EventEmitter();
    }

    add_listener(cb) {
        this.messageEventEmitter.on("message", cb);
    }

    remove_listener(cb) {
        this.messageEventEmitter.removeListener("message", cb);
    }

    append(data) {
        this.buffer += String(data);
        this.extract_complete_messages().forEach(complete_message => {
            this.messageEventEmitter.emit("message", complete_message);
        });;
    }

    extract_complete_messages() {
        const parts = this.buffer.split("\n");
        if (parts.length > 1) {
            this.buffer = parts.pop();
            return parts;
        }
        return [];
    }
}

module.exports = MessageBuffer;
