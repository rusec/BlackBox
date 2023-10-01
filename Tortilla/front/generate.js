const inquirer = require('inquirer');
const clear = require('clear');
const generatePasses = require('../modules/password-generator')
const fs = require('fs');
const { log } = require('../modules/util/debug');
const { delay } = require('../modules/util/util');

async function generatePasswords() {
    const home = require('./home')

    await clear();
    const { seed, amount } = await inquirer.prompt([
        {
            name: "seed",
            type: "input",
            message: "Please enter a seed:",
        },
        {
            name: "amount",
            type: "number",
            filter: function (value) {
                if (isNaN(value)) {
                    return ''
                }
                return value
            },
            validate: function (value) {
                if (value > 0) {
                    return true;
                }
                return "Please enter a value greater then 0";
            }
        },
    ])
    let passwords = generatePasses(amount, seed)
    for (const password of passwords) {
        console.log(password)
    }
    const { file } = await inquirer.prompt([
        {
            name: "file",
            type: "confirm",
            message: "would you like to output to a file?",
        },
    ])
    if (file) {
        var string = '';
        for (const password of passwords) {
            string += password + '\n'
        }
        fs.writeFileSync("phone.txt", string, 'utf8')
        log('Updated Text File')
        delay(300)
    }
    home.home()

}


module.exports = {
    generatePasswords
}