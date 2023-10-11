"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const TIMEOUT = 4000;
function sendCommandExpect(socket, command, expected) {
    return new Promise((resolve, reject) => {
        let enter = command + "\r";
        let log = "";
        const onData = (data) => {
            let parsedData = (0, util_1.removeANSIColorCodes)(data.toString());
            log += parsedData;
            if (log.includes(expected)) {
                resolve(log);
                cleanUp();
            }
        };
        const cleanUp = () => {
            clearTimeout(timeoutId);
            socket.stdout.removeListener("data", onData);
        };
        socket.stdout.on("data", onData);
        socket.write(enter);
        const timeoutId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}
function sendCommandNoExpect(socket, command, not_expected) {
    return new Promise((resolve, reject) => {
        let enter = command + "\r\r";
        let log = "";
        const onData = (data) => {
            let parsedData = (0, util_1.removeANSIColorCodes)(data.toString());
            log += parsedData;
            if (log.includes(not_expected)) {
                reject(log);
                cleanUp();
            }
        };
        const cleanUp = () => {
            clearTimeout(timeout);
            socket.stdout.removeListener("data", onData);
        };
        socket.stdout.on("data", onData);
        socket.write(enter);
        const timeout = setTimeout(() => {
            resolve(log);
            cleanUp();
        }, 6000);
    });
}
/**
 *
 * @param {import('ssh2').Channel} socket
 * @param {string} command
 * @returns {Promise<String>}
 */
function sendCommand(socket, command) {
    return new Promise((resolve, reject) => {
        let enter = command + "\r\n\r";
        let log = "";
        const onData = (data) => {
            let parsedData = (0, util_1.removeANSIColorCodes)(data.toString());
            log += parsedData;
            if (log.includes(command)) {
                resolve(log);
                cleanUp();
            }
        };
        const cleanUp = () => {
            clearTimeout(timerId);
            socket.stdout.removeListener("data", onData);
        };
        socket.stdout.on("data", onData);
        socket.write(enter, "utf8");
        const timerId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}
/**
 *
 * @param {import('ssh2').Channel} socket
 * @param {string} input
 * @returns {Promise<boolean>}
 */
function sendInput(socket, input) {
    return new Promise((resolve, reject) => {
        let enter = input + "\r";
        socket.stdin.write(enter, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(true);
            }
            clearTimeout(timerId);
        });
        const timerId = setTimeout(() => {
            reject();
        }, TIMEOUT);
    });
}
/**
 *
 * @param {import('ssh2').Channel} socket
 * @param {string} input
 * @param {string} expect
 * @returns {Promise<string>}
 */
function sendInputExpect(socket, input, expect) {
    return new Promise((resolve, reject) => {
        let enter = input + "\r";
        let log = "";
        const onData = (data) => {
            let parsedData = (0, util_1.removeANSIColorCodes)(data.toString());
            log += parsedData;
            if (log.includes(expect)) {
                resolve(log);
                cleanUp();
            }
        };
        const cleanUp = () => {
            clearTimeout(timeoutId);
            socket.stdout.removeListener("data", onData);
        };
        socket.stdout.on("data", onData);
        socket.stdin.write(enter, "utf8");
        const timeoutId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}
exports.default = { sendCommand, sendCommandExpect, sendCommandNoExpect, sendInput, sendInputExpect };
//# sourceMappingURL=socket_commands.js.map