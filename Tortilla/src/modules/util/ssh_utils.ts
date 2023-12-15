import SSH2Promise from "ssh2-promise";
import runningDB, { ServerInfo } from "./db";
import { getOutput, runCommand, runCommandNoExpect } from "./run_command";
import SSHConfig from "ssh2-promise/lib/sshConfig";
import { options } from "./options";
import { log } from "./debug";
import { commands } from "./commands";
import { Channel } from "ssh2";
import readline from "readline";
import { delay, removeANSIColorCodes } from "./util";
import logger, { log_options } from "./logger";
import {exec} from 'child_process';
import temp from 'temp';
import fs from 'fs';
import os from 'os';
import { isValidSession } from "./checkPassword";
// SSH COMMANDS for ejections
temp.track()

//NOTE : MAKE PUBLIC KEY OUTPUT


async function removeSSHkey(conn: SSH2CONN, os_type: options): Promise<boolean> {
    const ssh_key = await runningDB.getSSHPublicKey();
    conn.log("Removing SSH Key");

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
    conn.log("Removed SSH Key");

    return !(await testSSH(conn));
}
/**
 *
 * @param conn
 * @returns Should return true if it can connect using the public key
 */
async function testSSH(conn: SSH2CONN) {
    try {
        conn.info("Testing SSH Private Key");
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
        conn.info("Testing SSH Private Key active");
        return true;
    } catch (error) {
        conn.error("Unable to use SSH Private Key");
        return false;
    }
}
async function testPassword(conn: SSH2CONN, password: string) {
    const host = conn.config[0].host;
    try {
        conn.info("Testing Password");

        const sshConfig: SSHConfig = {
            host: conn.config[0].host,
            username: conn.config[0].username,
            password: password,
            authHandler: ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 4000,
        };
        const ssh = new SSH2Promise(sshConfig, true);
        await ssh.connect();
        await ssh.close();
        conn.info("Login Password active");
        return true;
    } catch (error) {
        
        if(error && typeof error == 'object' && error.toString().includes("ECONNREFUSED")){
            return true
        }
        if(error && typeof error == 'object' && error.toString().includes("All configured authentication methods failed")){
            return false;
        }
        conn.info("Unable to use Password");
        return false;
    }
}
//eject ssh function
//should check for ssh key in the folder, if it doesn't exist inject it.
//will try to ssh using the key, if it cant it will eject one more time
//TO DO DARWIN
async function injectSSHkey(conn: SSH2CONN, os_type: options, force?: undefined | boolean, trials: number = 0): Promise<boolean> {
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
    conn.log("Ejecting SSH Key");
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

async function injectCustomKey(conn: SSH2CONN, ssh_key: string, os_type: options) {
    conn.warn("Ejecting CUSTOM SSH Key");
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
    const conn = await makePermanentConnection(server);
    if (!conn) {
        return false;
    }
    let results = await injectSSHkey(conn, server["OS Type"]);
    return results;
}
async function addCustomSSH(server: ServerInfo, ssh_key: string) {
    const conn = await makePermanentConnection(server, true);
    if (!conn) {
        return false;
    }
    let results = await injectCustomKey(conn, ssh_key, server["OS Type"]);
    return results;
}

async function removeSSH(server: ServerInfo) {
    const conn = await makePermanentConnection(server, true);
    if (!conn) {
        return false;
    }
    let results = await removeSSHkey(conn, server["OS Type"]);
    return results;
}

async function makeConn(ip: string, username: string, password: string, useKey?: boolean): Promise<SSH2CONN | false> {
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
        const ssh = new SSH2CONN("", sshConfig);
        log(`${ip} Attempting connection`, "log");
        await ssh.connect();
        log(`${ip} Connected`, "log");
        return ssh;
    } catch (error) {
        log(`${ip} Unable to connect`, "log");
        return false;
    }
}




async function makeConnection(Server: ServerInfo, useKey?: boolean, statusLog = true, timeout = 3000): Promise<SSH2CONN | false> {
    try {
        const sshConfig: SSHConfig = {
            host: Server["IP Address"],
            username: Server.Username,
            password: Server.Password,
            privateKey: await runningDB.getSSHPrivateKey(),
            authHandler: useKey ? ["publickey", "password"] : ["password"],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: timeout,
            
        };
        const ssh = new SSH2CONN(Server.Name, sshConfig);
        statusLog && ssh.log("Attempting Connection");
        await ssh.connect();
        statusLog && ssh.log("Connected");
        return ssh;
    } catch (error) {
        statusLog && log(`[${Server["IP Address"]}] [${Server.Name}] Unable to connect: ${error}`, "error");
        logger.log(`[${Server["IP Address"]}] [${Server.Name}] Unable to connect: ${error}`, 'error')

        return false;
    }
}

let servers_connections:Map<string, SSH2CONN> = new Map();

async function makePermanentConnection(Server: ServerInfo, useKey?: boolean, statusLog = true, timeout = 3000): Promise<SSH2CONN | false> {
    
    // log(`called ${Server["IP Address"]}` )
    let findConnection = servers_connections.get(Server["IP Address"]);
    try {
        if(findConnection){
            // await findConnection.connect()
            await findConnection.exec("hostname")
            // findConnection.log("Maintained Connection")
    
            return findConnection;
        }
    } catch (error) {
        statusLog && findConnection?.error(`Unable to connect, making new connection: ${error}`)
        findConnection?.removeAllListeners();
        findConnection?.close();
        logger.log("deleteing connection")
        servers_connections.delete(Server["IP Address"]);
    }
   
    try {
        const sshConfig: SSHConfig = {
            host: Server["IP Address"],
            username: Server.Username,
            password: Server.Password,
            privateKey: await runningDB.getSSHPrivateKey(),
            authHandler: useKey ? ["publickey", "password"] : ["password"],
            reconnect: true,
            keepaliveInterval: 240 * 1000,
            keepaliveCountMax: 999,
            reconnectTries: 3,
            readyTimeout: timeout,
            
        };
        const ssh = new SSH2CONN(Server.Name, sshConfig );
        statusLog && ssh.log("Attempting Connection");
        await ssh.connect();
        ssh.on("ssh",async  (e)=>{
            logger.log(`[${ssh.config[0].host}] [${Server.Name}] Event: ${e}`)
        })
        statusLog && ssh.log("Connected");
        servers_connections.set(Server["IP Address"], ssh);
        
        return ssh;
    } catch (error) {
        statusLog && log(`[${Server["IP Address"]}] [${Server.Name}] Unable to connect: ${error}`, "error");
        logger.log(`[${Server["IP Address"]}] [${Server.Name}] Unable to connect: ${error}`, 'error')
        return false;
    }
}

let checking = false;
// this function is for presisents
// will reconnect to computer when its not able to connect. 
// if password changes, it will try to reconnect with the new config.
async function initConnections(){
    if(checking || !isValidSession()) return;
    try {
        checking = true;
        logger.log("Checking Connections " )
        let computers = await runningDB.readComputers();
    
        let promises = computers.map(async(computer)=>{
            try {
                let conn = servers_connections.get(computer["IP Address"]);
    
                // if conn is not there make a new connection to the server
                if(conn == undefined){
                    let new_connection  = await makePermanentConnection(computer,true, false, 5000)
                    if(!new_connection){
                        logger.log(`Unable to connect to server ${computer["IP Address"]}`)
                        return;
                    }
                    logger.log(`[${computer["IP Address"]}] [${computer.Name}] I got a connection`)
                    return;
                }
    
                // test if connection is still good
                try {
                    await conn.exec("hostname");
                    logger.log(`[${computer["IP Address"]}] [${computer.Name}] I still have connection`)
                } catch (error) {
                    try {
                        conn.close();
                        conn.removeAllListeners();
                    } catch (error) {}
                    let new_password_conn  = await makePermanentConnection(computer,true, false, 5000)
                    if(!new_password_conn){
                        logger.log(`Unable to connect to server ${computer["IP Address"]}`)
                        return;
                    }
                    logger.log(`[${computer["IP Address"]}] [${computer.Name}] I dont have connection, ${error}`)
                    
                }
            } catch (error) {
                logger.log(`${error}`)
            }
        })
        await Promise.allSettled(promises);
        logger.log("finished checking connections")
        await delay(10000);
    } catch (error) {
        logger.error("Checking Error " +error)
    }finally{
        checking = false;
    }
   
}
setInterval(()=> initConnections(), 10000)


function getAllCurrentConnections(){
    let ips = servers_connections.keys();
    let connections:SSH2CONN[] = []

    for(let ip of ips){
        let conn = servers_connections.get(ip);
        if(!conn){
            continue;
        }
        connections.push(conn)
    }

    return connections
}

process.on("exit",()=>{
    servers_connections.forEach(conn =>{
        conn.close();
    })
})


async function getStatus(Server: ServerInfo) {
    try {
        const ssh = await makePermanentConnection(Server, true, false, 2000);
        if (ssh == false) {
            return false;
        }
        return true;
    } catch (error: any) {
        return false;
    }
}

async function pingSSH(ip: string, username: string, password: string): Promise<{ operatingSystem: options; hostname: string, domain:string} | boolean> {
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
        const ssh = new SSH2CONN("", sshConfig);
        await ssh.connect();
        log("Connected", 'success')
        let os = await detect_os(ssh);
        let domain = ''
        if(os == 'windows'){
            domain = await detect_domain(ssh)
        }
        let hostname = await detect_hostname(ssh);
        await ssh.close();
        return { operatingSystem: os, hostname: hostname, domain:domain } || true;
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
            temp.open("temp_key", async function (err, info){
                if(err){
                    logger.log("unable to write temp file for ssh")
                    reject(false);
                    return;
                }
                fs.write(info.fd, await runningDB.getSSHPrivateKey(), (err) => {
                    console.log(err);
                });
                fs.close(info.fd, async (err)=>{
                    await execShell(info)
                    await temp.cleanup();
                    logger.log("cleaned up files")
                    resolve(true);
                })


            })


            async function execShell(info:temp.OpenFile){
                logger.log("Running interactive shell in different window")
                try {
                    switch (os.platform()) {
                        case 'win32':
                            exec(`start cmd.exe /K ssh ${server.Username}@${server["IP Address"]} -i ${info.path}`)
                            break;
                        case 'darwin':
                            exec(`echo "ssh ${server.Username}@${server["IP Address"]} -i ${info.path}" > /tmp/tmp.sh ; chmod +x /tmp/tmp.sh ; open -a Terminal /tmp/tmp.sh ; sleep 2 ; rm /tmp/tmp.sh`)
                            break;
                        case 'linux':
                            exec(`x-terminal-emulator -e "ssh ${server.Username}@${server["IP Address"]} -i ${info.path}"`);
                            break;
                        case 'freebsd':
                        case 'netbsd':
                        case 'openbsd':
                            exec(`xterm -e "ssh ${server.Username}@${server["IP Address"]} -i ${info.path}"`);
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    logger.log("unable to start shell")
                }
                
                await delay(3000);

            }


        })
}
async function detect_os(conn: SSH2CONN): Promise<options> {
    conn.log("Checking For Os");
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
async function detect_domain(conn:SSH2CONN){
    conn.log("Checking for Domain")
    const domain_string = await conn.exec(commands.AD.domain);
    return domain_string.split(':')[1].trim()
}
async function detect_hostname(conn: SSH2CONN) {
    conn.log("Checking For Hostname");
    const system = await conn.exec(commands.hostname);
    return system.trim();
}

class SSH2CONN extends SSH2Promise {
    hostname: string;
    ipaddress: string | undefined;
    constructor(hostname: string, options: Array<SSHConfig> | SSHConfig, disableCache?: boolean) {
        super(options, disableCache);
        this.hostname = hostname;
        this.ipaddress = this.config[0].host;
    }
    _getTag() {
        return `[${this.ipaddress}]`.bgGreen + ` ` + `[${this.hostname}]`.white + " ";
    }
    info(str: string) {
        log(this._getTag() + `${str}`, "info");
    }
    log(str: string) {
        log(this._getTag() + `${str}`, "log");
    }
    error(str: string) {
        log(this._getTag() + `${str}`, "error");
    }
    warn(str: string) {
        log(this._getTag() + `${str}`, "warn");
    }
    success(str: string) {
        log(this._getTag() + `${str}`, "success");
    }
    updateHostname(hostname: string) {
        this.hostname = hostname;
    }
}

export {
    SSH2CONN,
    pingSSH,
    injectSSHkey as ejectSSHkey,
    makeConnection,
    getStatus,
    removeSSHkey,
    removeSSH,
    addSSH,
    makeInteractiveShell,
    testPassword,
    detect_os,
    detect_hostname,
    addCustomSSH,
    makePermanentConnection,
    getAllCurrentConnections
};
