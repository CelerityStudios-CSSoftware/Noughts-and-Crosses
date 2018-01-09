/*jslint node*/

"use strict";

const logger = (function () {
    let newLogger = {
        logToConsole: function (...message) {
            console.log(...message);
        },

        logToConsoleErr: function (...message) {
            console.error(...message);
        },

        logToFile: function (message) {
            return message;
        },

        log: function (...message) {
            newLogger.logToConsole(...message);
            newLogger.logToFile(message);
        },

        logError: function (...message) {
            newLogger.logToConsoleErr(...message);
            newLogger.logToFile(...message);
        }
    };
    return newLogger;
}());

module.exports = logger;
