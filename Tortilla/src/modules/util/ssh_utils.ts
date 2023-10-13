import SSH2Promise from "ssh2-promise";
import runningDB, { ServerInfo } from "./db";
import { getOutput, runCommand, runCommandNoExpect } from "./run_command";
import SSHConfig from "ssh2-promise/lib/sshConfig";
import { detect_os } from "../detect_os";
import { options } from "./options";
import { log } from "./debug";
import { commands } from "./commands";
import { Home } from "../../front/home";
import { delay } from "./util";

// SSH COMMANDS for ejections

async function removeSSHkey(conn: SSH2Promise, os_type: options): Promise<boolean> {
    const ssh_key = await runningDB.getSSHPublicKey();
    log(`Removing SSH Key ${conn.config[0].host}`, "log");

    switch (os_type) {
        case "linux":
            var output = await runCommandNoExpect(conn, commands.ssh.remove.linux(ssh_key));
            if (!output) {
                return false;
            }
            break;
        case "freeBSD":
            var output = await runCommandNoExpect(conn, commands.ssh.remove.freebsd(ssh_key));
            if (!output) {
                return false;
            }
            break;
        case "freebsd":
            var output = await runCommandNoExpect(conn, commands.ssh.remove.freebsd(ssh_key));
            if (!output) {
                return false;
            }
            break;
        case "windows":
            var output = await runCommand(conn, commands.ssh.remove.windows(ssh_key), "successfully processed");
            if (!output) {
                return false;
            }
            break;
    }

    log(`Removed SSH Key ${conn.config[0].host}`, "log");
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
        log(`Testing SSH Private Key on ${host}`, "info");
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
        log(`SSH Private Key active on ${host}`, "info");
        return true;
    } catch (error) {
        log(`Unable to use SSH Private Key on ${host}`, "info");
        return false;
    }
}
async function getShellConnection(conn: SSH2Promise) {}

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
    switch (os_type) {
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
        case "freeBSD":
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
    log(`Ejecting SSH Key ${conn.config[0].host}`, "log");
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
                break;
        }
    }
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
        log(`Attempting connection to ${ip} `, "log");
        await ssh.connect();
        log(`Connected to ${ip}`, "log");
        return ssh;
    } catch (error) {
        log(`Unable to connect to ${ip}`, "log");
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
        log(`Attempting connection to ${Server["IP Address"]} `, "log");
        await ssh.connect();
        log(`Connected to ${Server["IP Address"]}`, "log");

        return ssh;
    } catch (error) {
        log(`Unable to connect to ${Server["IP Address"]}`, "log");
        return false;
    }
}

async function pingSSH(ip: string, username: string, password: string): Promise<options | boolean> {
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
        await ssh.close();
        return os || true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export { pingSSH, injectSSHkey as ejectSSHkey, makeConnection, makeConn, removeSSHkey, removeSSH, addSSH };
