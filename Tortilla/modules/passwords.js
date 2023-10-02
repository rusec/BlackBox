const { changePassword } = require('./change_password_linux')
const { changePasswordWin } = require('./change_password_windows')
const ssh2 = require('ssh2-promise');
const { changePasswordFreeBSD } = require('./change_password_freeBSD');
const { changePasswordDarwin } = require('./change_password_darwin');
const { log } = require('./util/debug');
const options = require('./util/options');
const { detect_os } = require('./detect_os');
/**
 * Represents information about a remote server or device.
 * @typedef {Object} ServerInfo
 * @property {string} Name - The name or identifier of the server/device.
 * @property {string} "IP Address" - The IP address of the server/device.
 * @property {string} Username - The username used for authentication.
 * @property {string} Password - The password used for authentication.
 * @property {string} "OS Type" - The type or name of the operating system (OS) running on the server/device.
 */


/**
 * Changes the password of a remote computer using SSH based on its operating system.
 *
 * @param {ServerInfo} computer - Information about the remote computer.
 * @param {string} new_password - The new password to set for the user account.
 * @param {Function} [save=async () => {}] - A function to save the changes (optional).
 * @returns {Promise<string|undefined>} A promise that resolves to a success message or an error message if changing the password fails.
 */
async function changePasswordOf(computer, new_password, save = async () => { }) {
    if (!new_password || new_password.length < 8) {
        return "Password does not meet requirements"
    }

    const sshConfig = {
        host: computer["IP Address"],
        username: computer.Username,
        password: computer.Password,
        authHandler: ['password'],
        reconnect: false,
        keepaliveInterval: 0,
    }
    const conn = new ssh2(sshConfig);
    log(`Attempting connection to ${computer["IP Address"]} `, 'log')
    try {
        let res;

        await conn.connect()
        log(`connected to ${computer["IP Address"]}`, 'log')
        if (!options.includes(computer["OS Type"])) {
            computer["OS Type"] = await detect_os(conn)
        }

        switch (computer["OS Type"].toLowerCase()) {
            case 'windows':
                res = await changePasswordWin(conn, computer.Username, new_password)
                break;
            case 'freebsd':
                res = await changePasswordFreeBSD(conn, computer.Username, new_password)
                break;
            case 'linux':
                res = await changePassword(conn, computer.Username, new_password, computer.Password)
                break;
            case 'darwin':
                res = await changePasswordDarwin(conn, computer.Username, computer.Password, new_password)
                break;
            default:
                res = 'Unknown OS'
                break;
        }

        await conn.close()

        conn.removeAllListeners()
        if (typeof res === 'string') {
            return res;
        }
        return await save();
    } catch (error) {
        await conn.close()
        log(`${conn.config[0].host} Got Error: ${error.message ? error.message : error}`, 'error')
        return `Got Error: ${error.message ? error.message : error}`
    }

}

module.exports = {
    changePasswordOf
}