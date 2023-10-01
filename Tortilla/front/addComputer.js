const inquirer = require("inquirer")
const util = require("../modules/util/util")
const runningDB = require("../modules/util/db")
const { pingSSH } = require("../modules/util/ping")
const { log } = require("../modules/util/debug")


const addComputer = async function () {
    const { home } = require("./home")

    const { name, ip, user, pass } = await inquirer.prompt([
        {
            name: 'name',
            message: "please enter a name:",
            type: 'input'
        },
        {
            name: 'ip',
            message: 'please enter an ip:',
            type: 'input',
            validate: (v) => {
                var valid = util.isValidIPAddress(v)
                if (valid) return true;
                return "invalid ip"
            }
        },
        {
            name: 'user',
            message: 'please enter a username',
            type: 'input'
        },
        {
            name: 'pass',
            message: 'please enter a password',
            type: 'input'
        },
    ])
    var os_type = await pingSSH(ip, user, pass)
    if (os_type) {
        await runningDB.addComputer(name, ip, user, pass, os_type)
    } else {
        log("unable to add computer, invalid", 'error')
        await util.delay(1000)
    }

    home()
}

module.exports = {
    addComputer
}