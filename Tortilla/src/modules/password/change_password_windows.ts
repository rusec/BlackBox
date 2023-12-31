import SSH2Promise from "ssh2-promise";
import { log } from "../console/debug";

import { delay } from "../util/util";
import socket_commands from "../util/socket_commands";
import { SSH2CONN, detect_hostname } from "../util/ssh_utils";
import { ServerInfo } from "../util/db";
import { LDAPChangePassword } from "./active_directory";
import logger from "../console/logger";

async function changePasswordWin(server:ServerInfo, conn: SSH2CONN |false, username: string, password: string) {
    if(!conn){
        try {
            await LDAPChangePassword(server,password)
            return true;
        } catch (error:any) {
            logger.log(`[${server["IP Address"]}] [${server.Name}] error ${error.message}`,'error')
            return error.message ? error : error.message;
         }
    }

    try {
        let checkReport = await check(conn);
        let useLocalUser = checkReport.useLocal
        if(checkReport.isDomainUser && checkReport.domainController){
            try {
                await LDAPChangePassword(server,password)
                return true;
            } catch (error:any) {
                logger.log(`[${server["IP Address"]}] [${server.Name}] LDAP Connection ${error.message}`,'warn')
                conn.log("Fallback ssh")
                return await changePasswordWinAD(conn,stripDomain(username), password);    
             }
        }
        if(checkReport.isDomainUser){
            return "UNABLE TO CHANGE PASSWORD OF DOMAIN ACCOUNT ON NON-DOMAIN-CONTROLLER"
        }
        return await changePasswordWindowsLocal(conn, username, password,useLocalUser);
    } catch (error: any) {
        logger.log("error", error);
        return error.message ? error : error.message;
    }
}
async function changePasswordWindowsLocal(conn:SSH2CONN, username:string, password:string, useLocalUser:boolean){
    let shellSocket = await conn.shell();
    const host = conn.config[0].host;

    try {
        conn.info(`Using ${useLocalUser ? "Get-Local" : "net user"}`)

        if (useLocalUser) {
            await socket_commands.sendCommandExpect(shellSocket, `powershell.exe`, `Windows PowerShell`);
            await delay(2000);
            await socket_commands.sendCommand(shellSocket, `$pass = Read-Host -AsSecureString`);
            await socket_commands.sendInput(shellSocket, `${password}`);
            await socket_commands.sendCommand(shellSocket, `$user = Get-LocalUser "${username}"`);
            await socket_commands.sendCommandNoExpect(shellSocket, `Set-LocalUser -Name $user -Password $pass`, "Unable to update the password");
        } else {
            await socket_commands.sendCommandExpect(shellSocket, `net user ${username} *`, "Type a password for the user:");
            await delay(2000);
            await socket_commands.sendInputExpect(shellSocket, `${password}`, "Retype the password to confirm:");
            await socket_commands.sendInputExpect(shellSocket, `${password}`, "The command completed successfully");
        }
        conn.success("Changed Password")
        
        await socket_commands.sendCommand(shellSocket, "exit", true);

        shellSocket.close();
    
        return true;
    } catch (error: any) {
        shellSocket.close();
        conn.error(`Unable to change Local password  ${error}`)
        return error ;
    }

   
}


async function changePasswordWinAD(conn: SSH2CONN, username: string, password: string) {
    const host = conn.config[0].host;

    conn.info("Changing Domain Controller Account")
    try {
        // let useLocalUser = await check(conn);
        let shellSocket = await conn.shell();

        try {
            conn.info("Resetting Active Directory User")

            await socket_commands.sendCommandExpect(shellSocket, `powershell.exe`, `PS`);
            await delay(2000);
            await socket_commands.sendCommand(shellSocket, "$pass = Read-Host -AsSecureString");
            await delay(500);
            await socket_commands.sendInput(shellSocket, `${password}`);
            await socket_commands.sendCommandNoExpect(
                shellSocket,
                `Set-ADAccountPassword –Identity "${username}" –Reset –NewPassword $pass`,
                "CategoryInfo"
            );
            conn.success("Changed password");
        } catch (error: any) {
            shellSocket.close();
            conn.error(`Unable to Change AD User password  ${error}`)
            return error;
        }

        await socket_commands.sendCommand(shellSocket, "exit", true);

        shellSocket.close();

        return true;
    } catch (error: any) {
        console.log("error", error);
        return error.message ? error.toString() : error.message;
    }
}

export { changePasswordWin };


type check_report = {
    domainController: boolean,
    useLocal:boolean,
    isDomainUser:boolean,

}
async function check(conn: SSH2CONN):Promise<check_report> {
    var passed = 2;
    var useLocalUser = true;
    let os_check = await conn.exec("echo %OS%");
    if (os_check.trim() != "Windows_NT") {
        conn.error(`Windows check error GOT ${os_check} WANTED Windows_NT, Please check for environment vars`)
        passed--;
    }
    let get_local_check;

    try {
        get_local_check = await conn.exec(`powershell.exe -Command "& {Get-LocalUser}"`);
    } catch (error: any) {
        if (error.trim().includes("is not recognized")) {
            conn.warn(`Windows check error GOT ${error.substring(0, 30)} WANTED User List, Powershell version might be out of date`)
            passed--;
            useLocalUser = false;
        }
    }
    let isDomainController = false;
    try {
        isDomainController = await conn.exec(`powershell.exe -Command "& {Get-ADDefaultDomainPasswordPolicy}"`)
        conn.log("Computer is a Domain Controller")
        isDomainController = true;
    } catch (error) {

    }
    let isDomainUser = false;
    try {
        let whoamiString = await conn.exec('whoami');
        let hostname = await detect_hostname(conn);

        // if hostname is not included in whoami then its a domain user
        if(!whoamiString.includes(hostname.toLowerCase())){
            isDomainUser = true;
        }

    } catch (error) {
        
    }
    conn.info(`Passed ${passed} of 2 tests`)
    return {
        useLocal: get_local_check,
        domainController: isDomainController,
        isDomainUser:isDomainUser
    };
}

// extracts the username from a domain
function stripDomain(fullUsername:string):string {
    // Use a regex pattern to match "domain\username"
    const regex = /(?:\\|@)([^\\@]+)$/;
    const match = fullUsername.match(regex);

    if (match && match[1]) {
        // If a match is found, return the captured group (username)
        return match[1];
    } else {
        // If no match is found, return the original string
        return fullUsername;
    }
}