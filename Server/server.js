"use strict";

const net = require('net');
const config = require('./config');
const MatchMaker = require('./match_maker');
const Player = require('./player');
const logger = require('./logger');

class Server {
    constructor() {
        this.matches = [];
        this.matchmaker = new MatchMaker();

        this.start = () => {
            this.socket = net.createServer({
                allowHalfOpen: config.server.allowHalfOpen,
                pauseOnConnect: config.server.pauseOnConnect
            });
            this.socket.on("error", (error) => {
                logger.logError("Socket error occured, resetting socket: ", error);
                this.start();
            });
            this.socket.on("connection", (socket) => {
                const player = new Player(socket);
                logger.log(
                    "Player connected from " + socket.remoteAddress
                    + ":" + socket.remotePort
                );
                this.matchmaker.newPlayer(player);
            });
            this.socket.maxConnections = config.server.maxConnections;

            this.socket.listen({
                host: config.server.host,
                port: config.server.port,
                backlog: config.server.backlog,
                exclusive: config.server.exclusive
            });
            logger.log(
                "----- Server Started -----\n",
                "Host: ", config.server.host, "\n",
                "Port: ", config.server.port,  "\n",
                "Backlog: ", config.server.backlog, "\n",
                "Exclusive: ", config.server.exclusive, "\n",
                "Max connections: ", config.server.maxConnections, "\n"
            );
        };

        this.shutdown = () => {
            this.socket.close();
        }
    }
}

module.exports = Server;
