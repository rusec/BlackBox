import delay from "delay";
import { removeANSIColorCodes } from "./util";
import { Channel } from "ssh2";
const TIMEOUT = 4000;

function sendCommandExpect(socket: Channel, command: string, expected: string) {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
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
        socket.write(`${command}\r`);

        const timeoutId = setTimeout(() => {
            reject(log);
            cleanUp();
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
                reject(log);
                cleanUp();
            }
        };

        const cleanUp = () => {
            clearTimeout(timeout);
            socket.stdout.removeListener("data", onData);
        };

        socket.stdout.on("data", onData);
        socket.write(`${command}\r\r`);

        const timeout = setTimeout(() => {
            resolve(log);
            cleanUp();
        }, 6000);
    });
}

function sendCommand(socket: Channel, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
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
        socket.write(`${command}\r\n\r`, "utf8");

        const timerId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}

function sendInput(socket: Channel, input: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        socket.stdin.write(`${input}\r`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
            clearTimeout(timerId);
        });

        const timerId = setTimeout(() => {
            reject();
        }, TIMEOUT);
    });
}

function sendInputExpect(socket: Channel, input: string, expect: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let log = "";

        const onData = (data: string) => {
            let parsedData = removeANSIColorCodes(data.toString());
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
        socket.stdin.write(`${input}\r`, "utf8");

        const timeoutId = setTimeout(() => {
            reject(log);
            cleanUp();
        }, TIMEOUT);
    });
}

export default { sendCommand, sendCommandExpect, sendCommandNoExpect, sendInput, sendInputExpect };