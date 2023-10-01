const inquirer = require('inquirer');
const clear = require('clear');
const runningDB = require('../modules/util/db');
const { edit } = require('./editor');
const { generatePasswords } = require('./generate');
const { runScript } = require('./passwordScript');
const { sshMenu } = require('./ssh');
const checkPassword = require('../modules/util/checkPassword');
const { addComputer } = require('./addComputer');
const { Settings } = require('./settings');

async function Home() {
    await clear();
    console.log(`Current Computers : ${(await runningDB.readComputers()).length}`.bgGreen)

    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
            pageSize: 60,

            choices: [
                new inquirer.Separator(),
                "Home",
                new inquirer.Separator(),
                "Run Password Changer",
                new inquirer.Separator(),
                "Computers",
                new inquirer.Separator(),
                "Generate Passwords",
                new inquirer.Separator(),
                "Settings",
                new inquirer.Separator(),
                "Exit",
                new inquirer.Separator()

            ],
            message: "Please select the program you want to run:",
        },
    ]);

    switch (program) {
        case "Home":
            Home();
            break;

        case "Run Password Changer":
            await clear();
            await checkPassword();
            runScript()
            break;
        case "Generate Passwords":
            generatePasswords()
            break;
        case "Computers":
            edit();
            break;
        case "Settings":
            Settings();
            break;
        case "Exit":
            await clear();
            process.exit(0)
            break;
    }
}

module.exports = {
    home: Home
}