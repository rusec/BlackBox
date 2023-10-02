const fs = require('fs')
const ssh2 = require('ssh2-promise')
const { log } = require('./util/debug')
const bcrypt = require('bcrypt');
const { runCommand, runCommandNoExpect, runCommandNotExpect } = require('./util/run_command');

const shadow = '/etc/shadow'
const shadowFile = '/etc/shadow'

// utilize passwd or a password manager like it to change password
// might want to change to using direct /usr/sbin/chpasswd



module.exports = {

    /**
     * Changes the password of a user on a remote system using SSH.
     *
     * @param {ssh2} conn - An SSH connection object.
     * @param {string} username - The username of the account for which the password will be changed.
     * @param {string} password - The new password to set for the user account.
     * @param {string} sudopassword - The sudo account password (if required for changing the password).
     * @param {number} [algorithm=6] - The algorithm used for password encryption (default is 6).
     * @returns {Promise<Boolean | String>} A promise that resolves to `true` if the password is changed successfully,
     *    or a string containing an error message if the change fails.
     */
    changePassword: async function (conn, username, password, sudopassword, algorithm = 6) {


        await checks(conn)


        const newpassword = algorithm === 6 ? encryptPassword(password) : await bcryptPassword(password)
        const string = `${username}:${newpassword + ''}`
        let error = true;
        // try without inputting sudo password
        let changedPassword = await runCommandNoExpect(conn, `echo '${string}' | sudo chpasswd -e`)
        if (typeof changedPassword != 'string') {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true;
        }
        error = `unable to use chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`
        log(error, 'warn')

        changedPassword = await runCommandNoExpect(conn, `echo '${string}' | chpasswd -e`)
        if (typeof changedPassword !== 'string') {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true
        }

        error = `unable to use sudo chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`
        log(error, 'warn')


        //try with inputting sudo password
        changedPassword = await runCommandNotExpect(conn, `echo -e '${sudopassword}\n${string}' | sudo -S chpasswd -e`, 'sorry')
        if (typeof changedPassword !== 'string') {
            log(`Changed password on ${conn.config[0].host}`, 'success')
            return true;
        }
        error = `unable to use sudo chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`
        log(error, 'error')



        return error;
    }


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
/**
 * 
 * @param {ssh2} conn 
 * @returns 
 */
async function checks(conn) {

    let passed = 7;
    log(`running security checks on ${conn.config[0].host}`, 'log')
    const checkedForShadow = await runCommand(conn, `if test -f ${shadow}; then
    echo "File exists.";
  fi`, 'file exists')
    if (typeof checkedForShadow === 'string') {
        log(`/etc/shadow check error on ${conn.config[0].host} GOT ${checkedForShadow} WANTED file exists, Please check for /etc/shadow`, 'error')
        passed--;
    }

    const checkForShadowPermissions = await runCommand(conn, `ls -l /etc/shadow`, '-rw-------')
    if (typeof checkForShadowPermissions === 'string') {
        log(`/etc/shadow permissions check failed on ${conn.config[0].host} GOT ${checkForShadowPermissions.trim().substring(0, 11)} WANTED -rw-------, Please check permissions`, 'warn')
        passed--;
    }


    const checkForPasswdPermissions = await runCommand(conn, `ls -l /etc/passwd`, '-rw-r--r--')
    if (typeof checkForPasswdPermissions === 'string') {
        log(`/etc/passwd permissions check failed on ${conn.config[0].host} GOT ${checkForPasswdPermissions.trim().substring(0, 11)} WANTED -rw-------, Please check permissions`, 'error')
        passed--;
    }

    let typecheckoptions = await runCommand(conn, 'type -t', '')
    if (typeof typecheckoptions === 'string') {
        log(`type option -t check error on ${conn.config[0].host} GOT ${typecheckoptions} WANTED , Please check for alias or no implementation`, 'warn')
        passed--;
    }
    let typecheck = await runCommand(conn, 'type -t type', 'builtin')
    if (typeof typecheck === 'string') {
        log(`type check error on ${conn.config[0].host} GOT ${typecheck} WANTED builtin, Please check for alias`, 'error')
        passed--;
    }
    let chpasswdCheck = await runCommand(conn, 'type -t chpasswd', 'file');
    if (typeof chpasswdCheck === 'string') {
        log(`chpasswd check error on ${conn.config[0].host} GOT ${chpasswdCheck} WANTED file, Please check for alias `, 'error')
        passed--;
    }
    let passwdCheck = await runCommand(conn, 'type -t passwd', 'file');
    if (typeof passwdCheck === 'string') {
        log(`passwd check error on ${conn.config[0].host} GOT ${passwdCheck} WANTED file, Please check for alias `, 'error')
        passed--;
    }


    log(`Passed ${passed} of 7 tests on ${conn.config[0].host}`, 'info')



    return chpasswdCheck
}
