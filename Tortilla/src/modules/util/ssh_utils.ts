import SSH2Promise from "ssh2-promise";
import runningDB, { ServerInfo } from "./db";
import { getOutput, runCommand, runCommandNoExpect } from "./run_command";
import SSHConfig from "ssh2-promise/lib/sshConfig";
import { options } from "./options";
import { log } from "./debug";
import { commands } from "./commands";
import { Channel } from "ssh2";
import readline from "readline";
import { removeANSIColorCodes } from "./util";
import logger from "./logger";
// SSH COMMANDS for ejections

async function removeSSHkey(conn: SSH2Promise, os_type: options): Promise<boolean> {
    const ssh_key = await runningDB.getSSHPublicKey();
    log(`${conn.config[0].host} Removing SSH Key`, "log");

    switch (os_type.toLowerCase()) {
        case "linux":
            var output = await runCommandNoExpect(conn, commands.ssh.remove.linux(ssh_key));
            if (!output) {
                return false;
            }
            break;
        case "freebsd":
            var output = await runCommandNoExpect(conn, commands.ssh.remove.freebsd(ssh_key));
            if (typeof output === "string" && output.includes("setenv")) {
                output = await runCommandNoExpect(conn, commands.ssh.remove.linux(ssh_key));
                if (!output) {
                    return false;
                }
            }
            break;
        case "windows":
            var output = await runCommand(conn, commands.ssh.remove.windows(ssh_key), "successfully processed");
            if (!output) {
                return false;
            }
            break;
    }

    log(`${conn.config[0].host} Removed SSH Key`, "log");
    return !(await testSSH(conn));
}
/**
 *
 * @param conn
 * @returns Should return true if it can connect using the public key
 */
async function testSSH(conn: SSH2Promise) {
    const host = conn.config[0].host;
    try {
        log(`${host} Testing SSH Private Key`, "info");
        const sshConfig: SSHConfig = {
            host: conn.config[0].host,
            username: conn.config[0].username,
            privateKey: await runningDB.getSSHPrivateKey(),
            authHandler: ["publickey"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        };
        const ssh = new SSH2Promise(sshConfig, true);
        await ssh.connect();
        await ssh.close();
        log(`${host} SSH Private Key active`, "info");
        return true;
    } catch (error) {
        log(`${host} Unable to use SSH Private Key`, "info");
        return false;
    }
}
async function testPassword(conn: SSH2Promise, password: string) {
    const host = conn.config[0].host;
    try {
        log(`${host} Testing Password`, "info");
        const sshConfig: SSHConfig = {
            host: conn.config[0].host,
            username: conn.config[0].username,
            password: password,
            authHandler: ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        };
        const ssh = new SSH2Promise(sshConfig, true);
        await ssh.connect();
        await ssh.close();
        log(`${host} SSH Password active`, "info");
        return true;
    } catch (error) {
        log(`${host} Unable to use Password`, "info");
        return false;
    }
}
//eject ssh function
//should check for ssh key in the folder, if it doesn't exist inject it.
//will try to ssh using the key, if it cant it will eject one more time
//TO DO DARWIN
async function injectSSHkey(conn: SSH2Promise, os_type: options, force?: undefined | boolean, trials: number = 0): Promise<boolean> {
    if (trials > 2) {
        return false;
    }
    const ssh_key = await runningDB.getSSHPublicKey();
    if (force) {
        await injectKey();
        return await test();
    }
    switch (os_type.toLowerCase()) {
        case "linux":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.linux);
            if (ssh_keys.includes(ssh_key)) {
                return await test();
            }
            break;
        case "freebsd":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.linux);
            if (ssh_keys.includes(ssh_key)) {
                return await test();
            }
            break;
        case "darwin":
            break;
        case "windows":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.windows);
            if (ssh_keys.includes(ssh_key)) {
                return await test();
            }
            break;
    }
    log(`${conn.config[0].host} Ejecting SSH Key`, "log");
    await injectKey();
    return await test();

    // Tries to connect to the ssh with the private key
    async function test() {
        try {
            let result = await testSSH(conn);
            if (result) return true;
            else {
                trials = trials + 1;
                return await injectSSHkey(conn, os_type, true, trials);
            }
        } catch (error) {
            return await injectSSHkey(conn, os_type, true, trials);
        }
    }
    async function injectKey() {
        switch (os_type) {
            case "windows":
                await runCommandNoExpect(conn, commands.ssh.eject.windows(ssh_key));
                break;
            case "linux":
                await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
                break;
            case "freebsd":
                await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
                break;
            case "freeBSD":
                await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
                break;
            case "darwin":
                await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
                break;
        }
    }
}

async function injectCustomKey(conn: SSH2Promise, ssh_key: string, os_type: options) {
    log(`${conn.config[0].host} Ejecting CUSTOM SSH Key`, "warn");
    logger.log(`${conn.config[0].host} Ejecting CUSTOM SSH Key`, "warn");

    switch (os_type.toLowerCase()) {
        case "windows":
            await runCommandNoExpect(conn, commands.ssh.eject.windows(ssh_key));
            break;
        case "linux":
            await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
            break;
        case "freebsd":
            await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
            break;
        case "darwin":
            await runCommandNoExpect(conn, commands.ssh.eject.linux(ssh_key));
            break;
    }
    switch (os_type.toLowerCase()) {
        case "linux":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.linux);
            if (ssh_keys.includes(ssh_key)) {
                return true;
            }
            break;
        case "freebsd":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.linux);
            if (ssh_keys.includes(ssh_key)) {
                return true;
            }
            break;
        case "darwin":
            break;
        case "windows":
            var ssh_keys = await getOutput(conn, commands.ssh.echo.windows);
            if (ssh_keys.includes(ssh_key)) {
                return true;
            }
            break;
    }
    return false;
}
async function addSSH(server: ServerInfo) {
    const conn = await makeConnection(server);
    if (!conn) {
        return false;
    }
    let results = await injectSSHkey(conn, server["OS Type"]);
    await conn.close();
    return results;
}
async function addCustomSSH(server: ServerInfo, ssh_key: string) {
    const conn = await makeConnection(server);
    if (!conn) {
        return false;
    }
    let results = await injectCustomKey(conn, ssh_key, server["OS Type"]);
    await conn.close();
    return results;
}

async function removeSSH(server: ServerInfo) {
    const conn = await makeConnection(server, true);
    if (!conn) {
        return false;
    }
    let results = await removeSSHkey(conn, server["OS Type"]);
    await conn.close();
    return results;
}

async function makeConn(ip: string, username: string, password: string, useKey?: boolean): Promise<SSH2Promise | false> {
    try {
        const sshConfig: SSHConfig = {
            host: ip,
            username: username,
            password: password,
            privateKey: await runningDB.getSSHPrivateKey(),
            authHandler: useKey ? ["publickey"] : ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        };
        const ssh = new SSH2Promise(sshConfig);
        log(`${ip} Attempting connection`, "log");
        await ssh.connect();
        log(`${ip} Connected`, "log");
        return ssh;
    } catch (error) {
        log(`${ip} Unable to connect`, "log");
        return false;
    }
}
async function makeConnection(Server: ServerInfo, useKey?: boolean): Promise<SSH2Promise | false> {
    try {
        const sshConfig: SSHConfig = {
            host: Server["IP Address"],
            username: Server.Username,
            password: Server.Password,
            privateKey: await runningDB.getSSHPrivateKey(),
            authHandler: useKey ? ["publickey", "password"] : ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        };
        const ssh = new SSH2Promise(sshConfig);
        log(`${Server["IP Address"]}  Attempting connection`, "log");
        await ssh.connect();
        log(`${Server["IP Address"]} Connected`, "log");

        return ssh;
    } catch (error) {
        log(`${Server["IP Address"]} Unable to connect`, "error");
        return false;
    }
}

async function pingSSH(ip: string, username: string, password: string): Promise<{ operatingSystem: options; hostname: string } | boolean> {
    try {
        const sshConfig: SSHConfig = {
            host: ip,
            username: username,
            password: password,
            authHandler: ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        };
        const ssh = new SSH2Promise(sshConfig);
        await ssh.connect();
        let os = await detect_os(ssh);
        let hostname = await detect_hostname(ssh);
        await ssh.close();
        return { operatingSystem: os, hostname: hostname } || true;
    } catch (error: any) {
        log((error as Error).message + ` ${ip}`, "error");
        return false;
    }
}

async function makeInteractiveShell(server: ServerInfo): Promise<boolean> {
    const conn = await makeConnection(server, true);
    if (!conn) {
        return false;
    }
    return new Promise(async (resolve, reject) => {
        const connected_ssh: Channel = await conn.shell();
        logger.log(`Made SSH interactive Shell for ${server["IP Address"]}`, "info");
        let history: string[] = [];
        var autoComplete = function completer(line: string) {
            const com = line.split(" ");
            let hits: string[] = [];
            if (com.length == 1) {
                hits = history.filter((c) => com[0].includes(c));
            } else {
                hits = history.filter((c) => c.includes(com[1]));
                hits = hits.map((hit) => com[0] + " " + hit);
            }

            return [hits.length ? hits : history, line];
        };
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: autoComplete,
        });

        let recent_input: string = "";
        let regex = new RegExp(/[\w.-]+(?:\.\w+)?/gm);
        // Pipe remote server output to local stdout
        connected_ssh.on("data", (data: string | Uint8Array) => {
            if (recent_input != "" && data.toString().includes(recent_input)) {
                recent_input = "";
                return;
            }
            let matches = removeANSIColorCodes(data.toString()).match(regex);
            if (matches) history.unshift(...matches);
            while (history.length > 60) {
                history.pop();
            }

            process.stdout.write(data);
        });

        rl.on("line", (input: string) => {
            recent_input = input;
            logger.log(`Command sent to ${conn.config[0].host}`, "info");
            connected_ssh.write(input + "\r");
        });
        rl.on("close", () => {
            connected_ssh.close();
            connected_ssh.removeAllListeners();
            resolve(true);
        });
        connected_ssh.on("end", async () => {
            rl.close();
            resolve(true);
        });
    });
}
async function detect_os(conn: SSH2Promise): Promise<options> {
    log(`${conn.config[0].host} checking for os`, "log");
    try {
        const system = await conn.exec(commands.detect.linux);
        const name = system.toLowerCase();

        if (name.includes("linux")) {
            return "linux";
        } else if (name.includes("freebsd") || name.includes("openbsd")) {
            return "freebsd";
        } else if (name.includes("darwin")) {
            return "darwin";
        } else {
            const windowsInfo = await conn.exec(commands.detect.windows);
            if (windowsInfo.toLowerCase().includes("windows")) {
                return "windows";
            }
            return "Unknown";
        }
    } catch (error) {
        if (typeof error === "string" && error.toLowerCase().includes("is not recognized")) {
            const windowsInfo = await conn.exec(commands.detect.windows);
            if (windowsInfo.toLowerCase().includes("windows")) {
                return "windows";
            }
        }
        return "Unknown";
    }
}
async function detect_hostname(conn: SSH2Promise) {
    log(`${conn.config[0].host} checking for hostname`, "log");
    const system = await conn.exec(commands.hostname);
    return system.trim();
}

export {
    pingSSH,
    injectSSHkey as ejectSSHkey,
    makeConnection,
    makeConn,
    removeSSHkey,
    removeSSH,
    addSSH,
    makeInteractiveShell,
    testPassword,
    detect_os,
    detect_hostname,
    addCustomSSH,
};
