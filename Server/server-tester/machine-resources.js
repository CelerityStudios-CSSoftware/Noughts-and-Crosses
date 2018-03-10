"use strict"

const Worker = require('./worker');

class MachineResources {
    constructor() {
        this.workers = new Map();
        this.new_worker = (id) => {
            if (this.workers.has(id)) {
                console.log("Worker already exists with id " + String(id) + "! To reuse this id, please kill the worker first.");
                return;
            }
            this.workers.set(id, new Worker(id));
        };

        this.get_worker = (id) => {
            const worker = this.workers.get(id);
            if (worker === undefined) {
                throw "No worker found with id " + String(id) + "!";
            }
            return worker;
        };

        this.kill_worker = (id) => {
            const worker = this.get_worker(id);
            worker.disconnect();
            this.workers.delete(id);
        };
    }
}

module.exports = MachineResources;
