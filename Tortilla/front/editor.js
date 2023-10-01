const inquirer = require('inquirer');
const runningDB = require('../modules/util/db');
const clear = require('clear');
const { delay } = require('../modules/util/util');
const checkPassword = require('../modules/util/checkPassword');
const { runSingleScript } = require('./passwordScript');


async function edit() {
    const { home } = require('./home');

    await clear();
    let json = await runningDB.readComputers();
    var ipAddressesChoices = json.map((v, k) => {
        return { name: v["IP Address"] + "  " + v["OS Type"] + " " + v.Name, value: k }
    })
    if (ipAddressesChoices.length === 0) {
        return home()
    }



    const { id } = await inquirer.prompt([
        {
            name: "id",
            type: 'list',
            pageSize: 50,

            choices: ipAddressesChoices,
            message: "Please select the IP Address you want to edit:",

        }
    ])



    await clear();
    console.log(`> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${json[id]["OS Type"]} `.bgBlue)

    const { section } = await inquirer.prompt([
        {
            name: "section",
            type: "list",
            pageSize: 50,

            choices: [
                new inquirer.Separator(),
                "Home",
                new inquirer.Separator(),
                { name: 'Change Password (if manually changed)', value: "Change Password" },
                new inquirer.Separator(),
                "Change Username",
                new inquirer.Separator(),
                "Change OS",
                new inquirer.Separator(),
                "Run Password Changer",
                new inquirer.Separator(),
                "Remove",
                new inquirer.Separator(),
                "Back",
                new inquirer.Separator(),

            ],
            message: "Please select a computer:",
        },
    ])

    switch (section) {
        case "Back":
            edit();
            break;
        case "Change Password":
            changePassword();
            break;
        case "Change Username":
            changeUsername();
            break;
        case "Change OS":
            changeOS();
            break;
        case "Remove":
            Remove()
            break;
        case "Run Password Changer":
            await checkPassword();
            await runSingleScript(id)
            break;
        case "Home":
            home();
            break;
    }

    async function Remove() {
        await clear();
        await checkPassword();
        console.log(`> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${json[id]["OS Type"]} `.bgBlue)

        let { confirm } = await inquirer.prompt([

            {
                name: "confirm",
                type: "confirm"
            }
        ])
        if (!confirm) {
            return edit();
        }

        await runningDB.removeComputer(id);
        return home();



    }
    async function changePassword() {
        let { newPassword, confirm } = await inquirer.prompt([
            {
                name: "newPassword",
                message: "new password",
                type: "input",

            },
            {
                name: "confirm",
                type: "confirm"
            }
        ])
        if (!confirm) {
            return home();
        }

        await runningDB.writeCompPassword(id, newPassword)
        console.log("password updated!")
        await delay(300)
        home();
    }
    async function changeUsername() {

        let { newUsername, confirm } = await inquirer.prompt([
            {
                name: "newUsername",
                type: "input",

            },
            {
                name: "confirm",
                type: "confirm"
            }
        ])
        if (!confirm) {
            return home();
        }
        json[id].Username = newUsername
        await runningDB.writeComputers(json)
        console.log("username updated!")
        await delay(300)
        home();
    }
    async function changeOS() {
        let { newOSType, confirm } = await inquirer.prompt([
            {
                name: "newOSType",
                type: "list",
                choices: [
                    { name: "General Linux (ubuntu like) uses ch", "value": 'linux' },
                    { name: "Windows or Windows Server", "value": 'windows' },
                    { name: "FreeBSD or OpenBSD", "value": 'freeBSD' },
                    { name: "darwin or macos", "value": 'darwin' },
                ]

            },
            {
                name: "confirm",
                type: "confirm"
            }
        ])
        if (!confirm) {
            return home();
        }
        json[id]["OS Type"] = newOSType
        await runningDB.writeComputers(json)
        console.log("OS updated!")
        await delay(300)
        home();
    }
}

function blankPassword(password) {
    return password && password[0] + "*****" + password[password.length - 1]
}

module.exports = {
    edit
}