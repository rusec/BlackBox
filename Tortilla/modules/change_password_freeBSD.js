const ssh2 = require('ssh2-promise')
const { log } = require('./util/debug')
const bcrypt = require('bcrypt');
const { runCommand, runCommandNoExpect } = require('./util/run_command');



module.exports = {
    /**
     * Changes the password of a user on a FreeBSD system using SSH.
     *
     * @param {ssh2} conn - An SSH connection object.
     * @param {string} username - The username of the user whose password you want to change.
     * @param {string} password - The new password to set for the user.
     * @returns {Promise<Boolean | String>} A promise that resolves to `true` if the password is changed successfully,
     *    or a string containing an error message if the change fails.
     */
    changePasswordFreeBSD: async function (conn, username, password) {

        await checks(conn)

        const bcrypt_password = await bcryptPassword(password)

        let changed_password = await runCommand(conn, `chpass -p '${bcrypt_password + ''}' ${username}`, `user information updated`)
        if (typeof changed_password != 'string') {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true
        }
        let error = `unable to use chpass on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`
        log(error, 'warn')

        changed_password = await runCommandNoExpect(conn, `usermod -p '${bcrypt_password + ''}' ${username}`)
        if (typeof changed_password != 'string') {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true
        }
        error = `unable to use usermod on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`
        log(error, 'error')
        return error;
    }


}
/**
 * Hashes a password using bcrypt with a generated salt.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} Throws an error if hashing fails.
 */
async function bcryptPassword(password) {
    try {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);

        const hashedPassword = await bcrypt.hash(password, salt);

        return hashedPassword;
    } catch (error) {
        throw error;
    }
}

/**
 * 
 * @param {ssh2} conn 
 * @returns 
 */
async function checks(conn) {
    let passed = 1;
    // log(`running security checks on ${conn.config[0].host}`, 'log')

}
