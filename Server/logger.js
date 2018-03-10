/*jslint node*/

"use strict";

const include = {
    fs: require("fs")
};

const logger = (function () {
    const levelEnum = {
        ERROR:      0,
        WARNING:    1,
        INFO:       2,
        VERBOSE:    3
    };

    let newLogger = {
        levelEnum: levelEnum,

        level: levelEnum.VERBOSE,

        setLevel: function (level) {
            newLogger.level = level;
        },

        logToConsole: function (...message) {
            console.log(...message);
        },

        logToConsoleErr: function (...message) {
            console.error(...message);
        },

        logToFile: function () {

        },

        logDebug: function (...message) {
            if (newLogger.level < newLogger.levelEnum.VERBOSE) {
                return;
            }
            newLogger.log("[Debug] ", ...message);
        },

        log: function (...message) {
            if (newLogger.level < newLogger.levelEnum.INFO) {
                return;
            }
            newLogger.logToConsole(...message);
            newLogger.logToFile(...message);
        },

        logWarning: function (...message) {
            if (newLogger.level < newLogger.levelEnum.WARNING) {
                return;
            }
            newLogger.log("[Warning] ", ...message);
        },

        logError: function (...message) {
            newLogger.logToConsoleErr("[Error] ", ...message);
            newLogger.logToFile(...message);
        }
    };

    newLogger.logFileIsEnabled = true;
    newLogger.logToFileStream = include.fs.createWriteStream("log.txt", {flags: "a"});
    newLogger.logToFile = function (...message) {
        if (true === newLogger.logFileIsEnabled) {
            newLogger.logToFileStream.write(message.join("") + "\n");
        }
    };

    return newLogger;
}());

module.exports = logger;
