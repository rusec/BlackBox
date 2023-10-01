const clear = require("clear");
const inquirer = require("inquirer");
const { sshMenu } = require("./ssh");
const { addComputer } = require("./addComputer");
const runningDB = require("../modules/util/db");


async function Settings() {
    const { home } = require("./home");

    const { program } = await inquirer.prompt([
        {
            name: 'program',
            type: 'list',
            pageSize: 60,
            choices: [
                new inquirer.Separator(),
                "Setup",
                new inquirer.Separator(),
                "Add Computer",
                new inquirer.Separator(),
                "Reset Master Password",
                new inquirer.Separator(),
                "Load CSV",
                new inquirer.Separator(),
                "Back",
                new inquirer.Separator(),
            ],
            message: "Please select a setting"
        }
    ])
    switch (program) {
        case "Setup":
            await clear()
            sshMenu()
            break;
        case "Add Computer":
            addComputer();
            break;
        case "Reset Master Password":
            await runningDB.resetMasterPassword()
            await home()
            break;
        case "Load CSV":
            await runningDB.readCSV();
            home();
            break;
        case "Back":
            home();
            break;
    }
}

module.exports = {
    Settings
}