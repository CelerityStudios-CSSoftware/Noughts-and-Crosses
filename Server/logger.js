/*jslint node*/

"use strict";

const logger = (function () {
    const levelEnum = {
        ERROR:      0,
        WARNING:    1,
        INFO:       2,
        VERBOSE:    3
    };

    let newLogger = {
        levelEnum: levelEnum,

        level: levelEnum.INFO,

        setLevel: function (level) {
            newLogger.level = level;
        },

        logToConsole: function (...message) {
            console.log(...message);
        },

        logToConsoleErr: function (...message) {
            console.error(...message);
        },

        logToFile: function (message) {
            return message;
        },

        logDebug: function (...message) {
            if (newLogger.level < newLogger.levelEnum.VERBOSE) {
                return;
            }
            newLogger.log(...message);
        },

        log: function (...message) {
            if (newLogger.level < newLogger.levelEnum.INFO) {
                return;
            }
            newLogger.logToConsole(...message);
            newLogger.logToFile(message);
        },

        logWarning: function (...message) {
            if (newLogger.level < newLogger.levelEnum.WARNING) {
                return;
            }
            newLogger.log(...message);
        },

        logError: function (...message) {
            newLogger.logToConsoleErr(...message);
            newLogger.logToFile(...message);
        }
    };
    return newLogger;
}());

module.exports = logger;
