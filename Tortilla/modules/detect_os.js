const unameCommand = 'uname -a'
const windowsSystemCommand = 'systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"'
const { log } = require('./util/debug')
module.exports = {
    /**
 * Detects the operating system of a remote system using SSH.
 *
 * @param {ssh2} conn - An SSH connection object.
 * @returns {Promise<string|undefined>} A promise that resolves to the detected operating system as a string ('linux', 'windows', 'freebsd', 'darwin'), or undefined if the OS could not be determined.
 */
    async detect_os(conn) {
        log(`checking for os ${conn.config[0].host}`, 'log')
        const system = await conn.exec(unameCommand)
        const name = system.toLowerCase()

        if (name.includes('linux')) {
            return 'linux'
        }
        if (name.includes('is not recognized')) {
            const windowsInfo = await conn.exec(windowsSystemCommand);
            if (windowsInfo.toLowerCase().includes('windows')) return 'windows'
        }
        if (name.includes('freebsd') || name.includes('openbsd')) {
            return 'freebsd'
        }
        if (name.includes('darwin')) {
            return 'darwin'
        }

    }
}