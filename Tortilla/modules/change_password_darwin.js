const ssh2 = require('ssh2-promise')
const { log } = require('./util/debug')
const bcrypt = require('bcrypt');

const passwd = '/etc/passwd'

// utilize passwd or a password manager like it to change password




module.exports = {
    /**
     * Changes the password of a user on a Darwin (macOS) system using SSH.
     *
     * @param {ssh2} conn - An SSH connection object.
     * @param {string} username - The username of the user whose password you want to change.
     * @param {string} oldpassword - The old password of the user.
     * @param {string} password - The new password to set for the user.
     * @returns {Promise<Boolean | String>} A promise that resolves to `true` if the password is changed successfully,
     *    or a string containing an error message if the change fails.
     */
    changePasswordDarwin: async function (conn, username, oldpassword, password) {

        let changed_password = await conn.exec(`dscl . -passwd /Users/${username} ${oldpassword} ${password}`)
        if (!changed_password.trim().includes('error')) {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true
        }
        const error = `unable to change password on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`
        log(error, 'error')
        return error;
    }


}