import fs from "fs";

import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";

import { delay } from "./util/util";
import socket_commands from "./util/socket_commands";

async function changePasswordWin(conn: SSH2Promise, username: string, password: string) {
    try {
        let useLocalUser = await check(conn);
        let shellSocket = await conn.shell();
        const host = conn.config[0].host;

        try {
            log(`Using ${useLocalUser ? "Get-Local" : "net user"} on ${host}`, "info");
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
            log(`Changed password on ${host}`, "success");
        } catch (error: any) {
            shellSocket.close();
            log(`Unable to change password on ${host}`, "error");
            return !error.message ? error.toString() : error.message;
        }

        await socket_commands.sendCommand(shellSocket, "exit");
        shellSocket.close();

        return true;
    } catch (error: any) {
        console.log("error", error);
        return error.message ? error : error.message;
    }
}

export { changePasswordWin };

async function check(conn: SSH2Promise) {
    var passed = 2;
    var useLocalUser = true;
    let os_check = await conn.exec("echo %OS%");
    if (os_check.trim() != "Windows_NT") {
        log(`Windows check error on ${conn.config[0].host} GOT ${os_check} WANTED Windows_NT, Please check for environment vars`, "error");
        passed--;
    }
    let get_local_check;

    try {
        get_local_check = await conn.exec(`PowerShell -Command "& {Get-LocalUser}"`);
    } catch (error: any) {
        if (error.trim().includes("is not recognized")) {
            log(
                `Windows check error on ${conn.config[0].host} GOT ${error.substring(
                    0,
                    30
                )} WANTED User List, Powershell version might be out of date`,
                "warn"
            );
            passed--;
            useLocalUser = false;
        }
    }

    log(`Passed ${passed} of 2 tests on ${conn.config[0].host}`, "info");
    return useLocalUser;
}
