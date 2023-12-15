import delay from "delay";
import { removeANSIColorCodes } from "./util";
import { Channel } from "ssh2";
const TIMEOUT = 4000;

/** THIS FILE IS FOR COMMANDS SENT BY A SOCKET CONNECTION */
function sendCommandExpect(socket: Channel, command: string, expected: string) {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
            log += parsedData;
            if (log.includes(expected)) {
                cleanUp();
                resolve(log);
            }
        };
        const cleanUp = () => {
            clearTimeout(timeoutId);
            socket.stdout.removeListener("data", onData);
        };

        socket.stdout.on("data", onData);
        socket.write(`${command}\r`);

        const timeoutId = setTimeout(() => {
            cleanUp();
            reject(log);
        }, TIMEOUT);
    });
}

function sendCommandNoExpect(socket: Channel, command: string, not_expected: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
            log += parsedData;
            if (log.includes(not_expected)) {
                cleanUp();
                reject(log);
            }
        };

        const cleanUp = () => {
            clearTimeout(timeout);
            socket.stdout.removeListener("data", onData);
        };

        socket.stdout.on("data", onData);
        socket.write(`${command}\r\r`);

        const timeout = setTimeout(() => {
            cleanUp();
            resolve(log);
        }, 6000);
    });
}
/**
 * Sends a command to the client.
 *  The reason for the exit boolean is because the socket will close after exit is sent meaning the client will not receive validation of exit
 */
function sendCommand(socket: Channel, command: string, exit?: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
            log += parsedData;
            if (log.includes(command)) {
                cleanUp();
                resolve(log);
            }
        };

        const cleanUp = () => {
            clearTimeout(timerId);
            socket.stdout.removeListener("data", onData);
        };

        socket.stdout.on("data", onData);
        socket.write(`${command}\r`, "utf8");
        if (exit) {
            resolve(log);
            return;
        }

        const timerId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}

function sendInput(socket: Channel, input: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        socket.stdin.write(`${input}\r`, (err) => {
            clearTimeout(timerId);
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });

        const timerId = setTimeout(() => {
            reject();
        }, TIMEOUT);
    });
}

function sendInputExpect(socket: Channel, input: string, expect: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let log:Buffer[] = [];

        const onData = (chuck: string) => {
            let parsedData = removeANSIColorCodes(chuck.toString());
            log.push(Buffer.from(chuck))
            if (removeANSIColorCodes(Buffer.concat(log).toString('utf8')).includes(expect)) {
                cleanUp();
                resolve(removeANSIColorCodes(Buffer.concat(log).toString('utf8')));
            }
        };

        const cleanUp = () => {
            clearTimeout(timeoutId);
            socket.stdout.removeListener("data", onData);
        };

        socket.stdout.on("data", onData);
        socket.stdin.write(`${input}\r`, "utf8");

        const timeoutId = setTimeout(() => {
            cleanUp();
            reject(removeANSIColorCodes(Buffer.concat(log).toString('utf8')));
        }, TIMEOUT);
    });
}

export default { sendCommand, sendCommandExpect, sendCommandNoExpect, sendInput, sendInputExpect };
