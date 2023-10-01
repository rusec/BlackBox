// utilize net user to change password


const fs = require('fs')
const ssh2 = require('ssh2-promise')


const { log } = require('./util/debug');
const { delay } = require('./util/util')
const socket_commands = require('./util/socket_commands')


module.exports = {
    /**
* 
* @param {ssh2} conn 
* @param {string} username 
* @param {string} password 
 * @returns {Promise<Boolean | String>}

*/
    changePasswordWin: async function (conn, username, password) {
        try {
            let useLocalUser = await check(conn);
            /**
            * @type {import('ssh2').Channel}
            */
            let shell_socket = await conn.shell()

            try {
                log(`Using ${useLocalUser ? 'Get-Local' : 'net user'} on ${conn.config[0].host}`, 'info')
                if (useLocalUser) {
                    await socket_commands.sendCommandExpect(shell_socket, `PowerShell`, `Windows PowerShell`)
                    await delay(3000)
                    await socket_commands.sendCommand(shell_socket, `$pass = Read-Host -AsSecureString`)
                    await socket_commands.sendInput(shell_socket, `${password}`)
                    await socket_commands.sendCommand(shell_socket, `$user = Get-LocalUser "${username}"`);
                    await socket_commands.sendCommandNoExpect(shell_socket, `Set-LocalUser -Name $user -Password $pass`, "Unable to update the password")
                }
                else {
                    await socket_commands.sendCommandExpect(shell_socket, `net user ${username} *`, "Type a password for the user:")
                    await delay(3000)
                    await socket_commands.sendInputExpect(shell_socket, `${password}`, "Retype the password to confirm:")
                    await socket_commands.sendInputExpect(shell_socket, `${password}`, "The command completed successfully")

                }
                log(`Changed password on ${conn.config[0].host}`, 'success')

            } catch (error) {
                shell_socket.close()
                log(`Unable to change password on ${conn.config[0].host}`, 'error')

                return !error.message ? error.toString() : error.message
            }
            shell_socket.close()
            return true
        } catch (error) {
            return error.message ? error : error.message
        }

    }
}


/**
 * 
 * @param {ssh2} conn 
 * @returns {Promise<boolean>} returns true if get-local user is recognized, false if not
 */
async function check(conn) {

    var passed = 2
    var useLocalUser = true;
    let os_check = await conn.exec('echo %OS%');
    if (os_check.trim() != 'Windows_NT') {
        log(`Windows check error on ${conn.config[0].host} GOT ${os_check} WANTED Windows_NT, Please check for environment vars`, 'error')
        passed--;
    }
    let get_local_check
    try {
        get_local_check = await conn.exec(`PowerShell -Command "& {Get-LocalUser}"`)
    } catch (error) {
        if (error.trim().includes('is not recognized')) {
            log(`Windows check error on ${conn.config[0].host} GOT ${error.substring(0, 30)} WANTED User List, Powershell version might be out of date`, 'warn')
            passed--;
            useLocalUser = false
        }
    }

    log(`Passed ${passed} of 2 tests on ${conn.config[0].host}`, 'info')
    return useLocalUser
}