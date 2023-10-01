const ssh2 = require('ssh2-promise')
const { log } = require('./util/debug')
const bcrypt = require('bcrypt');

const passwd = '/etc/passwd'

// utilize passwd or a password manager like it to change password




module.exports = {
    /**
 * 
 * @param {ssh2} conn 
 * @param {string} username 
 * @param {string} password 
 * @param {*} algorithm 
 * @returns {Promise<Boolean | String>}
 * 
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