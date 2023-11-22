import SSH2Promise from "ssh2-promise";
import { log } from "../util/debug";

import { delay } from "../util/util";
import socket_commands from "../util/socket_commands";

async function changePasswordWin(conn: SSH2Promise, username: string, password: string) {
    try {
        let checkReport = await check(conn);
        let useLocalUser = checkReport.useLocal
        const host = conn.config[0].host;
        if(!(stripDomain(username) == username)){
            if(!checkReport.domainController){
                return "UNABLE TO CHANGE PASSWORD OF DOMAIN ACCOUNT ON NON-DOMAIN-CONTROLLER"
            }
            log(`${host} Change Domain Level Account`, 'info');

            return await changePasswordWinAD(conn,stripDomain(username), password);

        }
        return await changePasswordWindowsLocal(conn, username, password,useLocalUser);
    } catch (error: any) {
        console.log("error", error);
        return error.message ? error : error.message;
    }
}
async function changePasswordWindowsLocal(conn:SSH2Promise, username:string, password:string, useLocalUser:boolean){
    let shellSocket = await conn.shell();
    const host = conn.config[0].host;

    try {
    
        log(`${host} Using ${useLocalUser ? "Get-Local" : "net user"}`, "info");
        if (useLocalUser) {
            await socket_commands.sendCommandExpect(shellSocket, `PowerShell`, `Windows PowerShell`);
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
        log(`${host} Changed password`, "success");
    } catch (error: any) {
        shellSocket.close();
        log(`${host} Unable to change password`, "error");
        return !error.message ? error.toString() : error.message;
    }

    await socket_commands.sendCommand(shellSocket, "exit", true);

    shellSocket.close();

    return true;
}


async function changePasswordWinAD(conn: SSH2Promise, username: string, password: string) {
    try {
        // let useLocalUser = await check(conn);
        let shellSocket = await conn.shell();
        const host = conn.config[0].host;

        try {
            log(`${host} Resetting Active Directory User`, "info");

            let log_script = await socket_commands.sendCommandExpect(shellSocket, `PowerShell`, `PS`);
            console.log(log_script)

            await delay(2000);
             log_script = await socket_commands.sendCommand(shellSocket, "$pass = Read-Host -AsSecureString");
            console.log(log_script)
            await delay(1000);
            await socket_commands.sendInput(shellSocket, `${password}`);
            await socket_commands.sendCommandNoExpect(
                shellSocket,
                `Set-ADAccountPassword –Identity "${username}" –Reset –NewPassword $pass`,
                "CategoryInfo"
            );

            log(`${host} Changed password`, "success");
        } catch (error: any) {
            shellSocket.close();
            log(`${host} Unable to change password`, "error");
            return !error.message ? error.toString() : error.message;
        }

        await socket_commands.sendCommand(shellSocket, "exit", true);

        shellSocket.close();

        return true;
    } catch (error: any) {
        console.log("error", error);
        return error.message ? error : error.message;
    }
}

export { changePasswordWin };


type check_report = {
    domainController: boolean,
    useLocal:boolean,

}
async function check(conn: SSH2Promise):Promise<check_report> {
    var passed = 2;
    var useLocalUser = true;
    let os_check = await conn.exec("echo %OS%");
    if (os_check.trim() != "Windows_NT") {
        log(`${conn.config[0].host} Windows check error GOT ${os_check} WANTED Windows_NT, Please check for environment vars`, "error");
        passed--;
    }
    let get_local_check;

    try {
        get_local_check = await conn.exec(`PowerShell -Command "& {Get-LocalUser}"`);
    } catch (error: any) {
        if (error.trim().includes("is not recognized")) {
            log(
                `${conn.config[0].host} Windows check error GOT ${error.substring(0, 30)} WANTED User List, Powershell version might be out of date`,
                "warn"
            );
            passed--;
            useLocalUser = false;
        }
    }
    let isDomainController = false;
    try {
        isDomainController = await conn.exec(`PowerShell -Command "& {Get-ADDefaultDomainPasswordPolicy}`)
        isDomainController = true;
    } catch (error) {

    }

    log(`${conn.config[0].host} Passed ${passed} of 2 tests`, "info");
    return {
        useLocal: get_local_check,
        domainController: isDomainController,
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