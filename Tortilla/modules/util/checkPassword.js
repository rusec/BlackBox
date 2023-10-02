const runningDB = require("./db");
const inquirer = require('inquirer')
const clear = require('clear')


/**
 * Checks and validates a master password stored in the running database or prompts the user to set it if not found.
 * After validating the master password, it allows access to protected functionality.
 *
 * @returns {Promise<void>} A promise that resolves when the password check and validation process is completed.
 */
async function checkPassword() {
    const hash = await runningDB.readPassword();
    if (hash === '') {
        const { master_password } = await inquirer.prompt([
            {
                name: 'master_password',
                type: 'input',
                validate: function (value) {
                    if (value.length > 8) {
                        return true;
                    }
                    return 'Password must be longer then 8 characters'
                },
                message: "please enter a master password"
            }
        ])
        await runningDB.writePassword(master_password);
    }
    await clear();
    let trials = 3;
    await inquirer.prompt([
        {
            name: 'master_password',
            type: 'password',
            validate: async function (value) {
                const v = await runningDB.validateMasterPassword(value);
                if (trials <= 0) {
                    process.exit(0)
                }
                if (!v) {
                    trials--;
                    return 'Incorrect Password';

                }
                return true;

            }
        }
    ])

}

module.exports = checkPassword