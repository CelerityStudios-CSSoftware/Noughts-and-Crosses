"use strict";

const events = require('events');
const MessageBuffer = require('./message_buffer');
const config = require('./config');
const logger = require('./logger');
const IdGenerator = require('./id_generator');

class Player {
    constructor(socket, cid = "") {
        this.socket = socket;
        this.socket.setEncoding(config.socket.encoding);
        this.socket.setKeepAlive(config.socket.keepAlive, config.socket.keepAliveInitialDelay);
        this.socket.setNoDelay(config.socket.noDelay);
        this.socket.setTimeout(config.socket.timeout);
        if (cid === "") this.cid = IdGenerator.generateId();
        this.eventEmitter = new events.EventEmitter();
        this.messageBuffer = new MessageBuffer();
        this.muted = false;

        this.socket.on("error", (error) => {
            logger.logError(error);
        });

        const codes = config.socket.codes;
        this.messageTypes = new Map([
            ["connectionId" , codes.connectionId],
            ["playerFound"  , codes.playerFound],
            ["playerMove"   , codes.playerMoved],
            ["playerLeft"   , codes.playerLeft],
            ["endGame"      , codes.endGame],
            ["playerTurn"   , codes.playerTurn],
            ["playerWon"    , codes.playerWon],
            ["draw"         , codes.playerDraw],
            ["gameStarted"  , codes.startGame]
        ]);
        this.messageCodes = new Map(Array.from(this.messageTypes.entries()).map((el) => [el[1], el[0]]))

        this.socket.on("data", data => {
            logger.logDebug("Player '" +  this.cid + "' data '" + data + "'");
            this.messageBuffer.append(data);
        });
        this.messageBuffer.add_listener(data => {
            logger.logDebug("Handling message '" + data + "'");
            data = data.trim();
            logger.logDebug("Handling trimmed message '" + data + "'");
            const parts = data.split(config.socket.codes.dataSeparator);
            logger.logDebug("Handling split message '" + parts + "'");
            const [code, args] = [parts[0], parts.slice(1)];
            logger.logDebug("Parsing message from '" + this.cid + "' k'" + code + "' v'" + args + "'");
            if (this.messageCodes.has(code) === false) {
                logger.logWarning("Received invalid message type '" + code + "' from player " + this.cid);
                logger.logWarning("-- args of invalid message '" + args.join(codes.dataSeparator) + "'");
                return;
            }
            const messageType = this.messageCodes.get(code);
            logger.logDebug("emitting '" + messageType + "' w/ args '" + args + "'");
            this.eventEmitter.emit(messageType, ...args);
        });

        this.socket.on("close", () => {
            logger.log(
                "Player " + this.cid + " disconnected from "
                + this.socket.remoteAddress + ":" + this.socket.remotePort
            );
            this.eventEmitter.emit("disconnected", this);
        });

        this.sendMessage = (msgType, ...args) => {
            if (this.muted === true) return;
            if (this.messageTypes.has(msgType) === false) {
                logger.logWarning("Can't send message of type '" + msgType + "'. Not a valid type.");
                return;
            }
            const code = this.messageTypes.get(msgType);
            const msg = [String(code)].concat(args).join(codes.dataSeparator);
            this.socket.write(msg + codes.endLine);
        };

        this.sendMessage("connectionId", this.cid);

        this.mute = () => this.muted = true;
        this.unmute = () => this.muted = false;

        this.onMessage = (msgType, cb) => {
            this.eventEmitter.on(msgType, cb);
        };

        this.removeListener = (msgType, cb) => {
            this.eventEmitter.removeListener(msgType, cb);
        };
    }
}

module.exports = Player;
