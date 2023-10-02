const inquirer = require('inquirer');
const runningDB = require('../modules/util/db');
const clear = require('clear');
const { isValidIPAddress } = require('../modules/util/util');
const { pingSSH } = require('../modules/util/ping');
const { log } = require('../modules/util/debug');
const fs = require('fs/promises')
const util = require('util')
const exec = util.promisify(require('node:child_process').exec);

async function sshMenu() {

    const { computers_string, usernames_string, passwords_string } = await inquirer.prompt([
        {
            name: 'computers_string',
            value: 'input',
            /**
             * 
             * @param {string} v 
             */
            validate: (v) => {
                var strings = v.split(',')
                var computers = strings.map(v => {
                    var filtered_string = v.trim().split(" ")
                    return {
                        name: filtered_string[0] || "",
                        ip: filtered_string[1] || ""
                    }
                })
                for (const computer of computers) {
                    if (!(computer.name.length > 1 && isValidIPAddress(computer.ip))) {
                        return "Please enter in format {Name} {IP},";
                    }
                }
                return true
            },
            message: "please enter a list of names and ips separated by commas (separated by commas)"
        },
        {
            'name': 'usernames_string',
            value: 'input',
            message: "please enter a list of usernames (separated by commas)"
        },
        {
            'name': 'passwords_string',
            value: 'input',
            message: "please enter a list of passwords (separated by commas)"
        }
    ])



    var computers = computers_string.split(',').map(v => {
        var filtered_string = v.trim().split(" ")
        return {
            name: filtered_string[0] || "",
            ip: filtered_string[1] || ""
        }
    })
    var usernames = usernames_string.split(',').map(v => v.trim())
    var passwords = passwords_string.split(',').map(v => v.trim())


    var users_sessions = usernames.map(user => {
        return passwords.map(pass => {
            return {
                user: user,
                pass: pass
            }
        })
    })
    let sessions = []
    for (const users of users_sessions) for (let session of users) {
        sessions.push(session)
    }

    var promises = computers.map(async (computer) => {
        var passed = false;
        log(`Attempting to login ${computer.ip} using ${sessions.length} sessions`, 'info')

        for (const session of sessions) {

            var os_type = await pingSSH(computer.ip, session.user, session.pass)

            if (os_type) {
                log(`Found valid session for ${computer.ip} saving...`, 'success')
                await runningDB.addComputer(computer.name, computer.ip, session.user, session.pass, os_type)
                passed = true;
            }
        }
        if (!passed) {
            log(`Unable to login, invalid user pass combo ${computer.ip}`, 'error')
        }
        return passed;
    })
    await Promise.allSettled(promises)



    const { logHost } = await inquirer.prompt([
        {
            name: 'logHost',
            type: 'confirm',
            message: 'Would you like to append you computers host file.(requires admin)'
        }
    ])
    if (logHost) {
        var string = '\n';
        for (const computer of computers) {
            string += `${computer.ip}     ${computer.name}\n`
        }
        if (process.platform === 'linux' || process.platform === 'darwin' || process.platform === 'freebsd' || process.platform === 'openbsd') {
            await exec(`echo '${string}' | sudo tee -a /etc/hosts`)
        }
        if (process.platform === 'win32') {
            // add windows host input
            // await exec(`echo '${string}' | tee -a /etc/hosts`)
        }
    }


}
module.exports = {
    sshMenu
}

