const ssh2 = require('ssh2-promise')
const { log } = require('./util/debug')
const bcrypt = require('bcrypt');
const { runCommand, runCommandNoExpect } = require('./util/run_command');

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
function encryptPassword(password) {

    var passwordHash;
    var passwordSalt = '';
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        passwordSalt += possible.charAt(Math.floor(Math.random() * possible.length));

    var sha512crypt = require('sha512crypt-node');
    passwordHash = sha512crypt.sha512crypt(password, passwordSalt);
    return passwordHash


}
async function bcryptPassword(password) {
    try {
        // Generate a salt (a random string)
        const saltRounds = 10; // You can adjust this according to your needs
        const salt = await bcrypt.genSalt(saltRounds);

        // Hash the password using the salt
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
