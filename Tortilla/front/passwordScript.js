const inquirer = require('inquirer');
const runningDB = require('../modules/util/db');
const clear = require('clear');
const { delay } = require('../modules/util/util');
const { changePasswordOf } = require('../modules/passwords');
const { log } = require('../modules/util/debug');
const passwordGenerator = require('../modules/password-generator');
const fs = require('fs')
const util = require('../modules/util/util')

async function runScript() {
    const { home } = require('./home');
    const originalConsoleLog = console.log;
    let capturedOutput = '';

    try {
        const computers = await runningDB.readComputers();


        const { seed } = await inquirer.prompt([
            {
                "name": "seed",
                "type": 'input',
                "message": "Please enter a seed",
            },
        ])

        console.log = function (...args) {
            // Convert the arguments to a string and append to the captured output
            const string = args.map(arg => String(arg)).join(' ')
            capturedOutput += string + '\n';
            originalConsoleLog(string)
        };
        await clear()
        log(`running script on ${computers.length} computers`)

        const passwords = passwordGenerator(computers.length, seed)


        const promises = computers.map((element, i) => {
            const password = passwords[i];
            const callBack = async function () {
                return await runningDB.writeCompPassword(i, password);
            };
            return changePasswordOf(element, password, callBack);
        });



        var results = await Promise.allSettled(promises)
        const numberOfSuccess = results.filter(element => typeof element.value === 'boolean' && element.value).length;

        console.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length}`.green)



        const { logToFile } = await inquirer.prompt([
            {
                "name": "logToFile",
                "type": 'confirm',
                "message": "Would you like to generate a report?",
            },
        ])
        if (logToFile) {
            const runningLog = results.map((element, i) => {
                if (typeof element.value === 'boolean' && element.value) {
                    return `Changed password of ${computers[i]["IP Address"]}`;
                } else {
                    return `Error on ${computers[i]["IP Address"]} ${element.value}`;
                }
            }).join('\n');

            fs.writeFileSync('log.log', util.removeANSIColorCodes(runningLog + '\n\nLOG:\n' + capturedOutput), 'utf8')
        }

        await delay(1000)

    } catch (error) {
        console.log(`Error while updating passwords ${error}`)
        await delay(1000)

    } finally {
        console.log = originalConsoleLog
    }

    home();

    //Set up reporting


}

/**
 * 
 * @param {Number} id index of computer to change
 */
async function runSingleScript(id) {

    try {
        const { password } = await inquirer.prompt([
            {
                "name": "password",
                "type": 'password',
                "message": "Please enter a new password",
                validate: function (value) {
                    if (value.length > 8) {
                        return true;
                    }
                    return "password must be longer then 8 characters"
                }
            },
        ])
        const computers = await runningDB.readComputers();
        log(`running script on ${computers[id].Name}`)
        let numberOfSuccess = 0;
        const result = await changePasswordOf(computers[id], password)
        if (typeof result === 'boolean' && result) {
            computers[i].Password = password;
            numberOfSuccess++;
        }

        log(`Successfully changed passwords on ${numberOfSuccess} of 1`.green)

        runningDB.writeComputers(computers)



    } catch (error) {
        console.log(`Error while updating passwords ${error}`)
        await delay(1000)
    }
    home()


}

module.exports = {
    runScript,
    runSingleScript
}