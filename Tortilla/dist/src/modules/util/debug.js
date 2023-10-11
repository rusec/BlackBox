"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = exports.success = exports.error = exports.log = void 0;
require("colors");
const colors_1 = __importDefault(require("colors"));
const bold = colors_1.default.bold;
/**
 * Logs a message with an optional message type and override flag to the console.
 *
 * @param {string} message - The message to be logged.
 * @param {string} [type="debug"] - The type of message (e.g., "log", "debug", "warn", "error", "info", "success").
 * @param {boolean} [override=false] - If true, the message type is overridden by the provided type.
 * @returns {void} This function does not return a value.
 */
var log = (message, type = "debug", override = false) => {
    let t;
    switch (type.toLowerCase()) {
        default:
        case "log":
            t = "[LOG] ".blue;
            break;
        case "debug":
            t = "[DEBUG] ".green;
            break;
        case "warn":
            t = "[WARNING] ".yellow;
            break;
        case "error":
            t = "[ERROR] ".red;
            break;
        case "info":
            t = "[MESSAGE] ".magenta;
            break;
        case "success":
            t = bold("[SUCCESS]".green);
            break;
    }
    console.log(t, message);
};
exports.log = log;
var error = (message) => {
    console.log("[ERROR] ".red, message);
};
exports.error = error;
var success = (message) => {
    console.log(bold("[SUCCESS]".green), message);
};
exports.success = success;
var info = (message) => {
    console.log("[MESSAGE] ".magenta, message);
};
exports.info = info;
//# sourceMappingURL=debug.js.map