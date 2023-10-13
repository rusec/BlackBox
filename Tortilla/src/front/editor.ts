import inquirer from "inquirer";
import runningDB from "../modules/util/db";
import clear from "clear";
import { delay } from "../modules/util/util";
import { checkPassword } from "../modules/util/checkPassword";
import { runSingleScript } from "./passwordScript";
import { Home } from "./home";
import { addSSH, removeSSH, removeSSHkey } from "../modules/util/ssh_utils";
import { changePasswordOf } from "../modules/passwords";
import { log } from "../modules/util/debug";
async function edit() {
    await clear();
    let json = await runningDB.readComputers();
    var ipAddressesChoices = json.map((v, k) => {
        return { name: v["IP Address"] + "  " + v["OS Type"] + " " + v.Name, value: k };
    });
    if (ipAddressesChoices.length === 0) {
        return Home();
    }

    const { id } = await inquirer.prompt([
        {
            name: "id",
            type: "list",
            pageSize: 50,

            choices: ipAddressesChoices,
            message: "Please select the IP Address you want to edit:",
        },
    ]);
    const head = `> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${
        json[id]["OS Type"]
    } | pub_key: ${json[id].ssh_key ? "true" : "false"}`.bgBlue;

    await clear();
    console.log(head);

    const { section } = await inquirer.prompt([
        {
            name: "section",
            type: "list",
            pageSize: 50,

            choices: [
                new inquirer.Separator(),
                "Back",
                new inquirer.Separator(),
                { name: "Change Password", value: "change_pass_man" },
                new inquirer.Separator(),
                { name: "Change Password (if changed from target)", value: "Change Password" },
                "Change Username",
                "Change OS",
                new inquirer.Separator(),
                { name: "Inject SSH Key", value: "add_ssh" },
                { name: "Remove SSH Key", value: "remove_ssh" },
                new inquirer.Separator(),
                { name: "Remove Computer", value: "Remove" },
                new inquirer.Separator(),
                "Home",
                new inquirer.Separator(),
            ],
            message: "Please select a computer:",
        },
    ]);

    switch (section) {
        case "Back":
            edit();
            break;
        case "Change Password":
            await checkPassword();
            await changePassword();
            edit();
            break;
        case "Change Username":
            changeUsername();
            break;
        case "Change OS":
            changeOS();
            break;
        case "Remove":
            Remove();
            break;
        case "change_pass_man":
            await checkPassword();
            await runSingleScript(id);
            break;
        case "add_ssh":
            await checkPassword();
            let r = await addSSH(json[id]);
            if (r) {
                await runningDB.writeCompSSH(id, r);
            }
            edit();
            break;
        case "remove_ssh":
            await checkPassword();
            let result = await removeSSH(json[id]);
            if (result) {
                await runningDB.writeCompSSH(id, !result);
            }
            edit();
            break;
        case "Home":
            Home();
            break;
    }

    async function Remove() {
        await clear();
        await checkPassword();
        console.log(head);

        let { confirm } = await inquirer.prompt([
            {
                name: `confirm`,
                message: `confirm removing ${json[id].Name} ${json[id]["IP Address"]}`,
                type: "confirm",
            },
        ]);
        if (!confirm) {
            return edit();
        }

        await runningDB.removeComputer(id);

        return Home();
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
                type: "confirm",
            },
        ]);
        if (!confirm) {
            return Home();
        }

        await runningDB.writeCompPassword(id, newPassword);

        console.log("password updated!");
        await delay(300);

        Home();
    }
    async function changeUsername() {
        let { newUsername, confirm } = await inquirer.prompt([
            {
                name: "newUsername",
                type: "input",
            },
            {
                name: "confirm",
                type: "confirm",
            },
        ]);
        if (!confirm) {
            return Home();
        }

        json[id].Username = newUsername;
        await runningDB.writeComputers(json);

        console.log("username updated!");
        await delay(300);

        Home();
    }
    async function changeOS() {
        let { newOSType, confirm } = await inquirer.prompt([
            {
                name: "newOSType",
                type: "list",
                choices: [
                    { name: "General Linux (ubuntu like) uses ch", value: "linux" },
                    { name: "Windows or Windows Server", value: "windows" },
                    { name: "FreeBSD or OpenBSD", value: "freeBSD" },
                    { name: "darwin or macos", value: "darwin" },
                ],
            },
            {
                name: "confirm",
                type: "confirm",
            },
        ]);
        if (!confirm) {
            return Home();
        }

        json[id]["OS Type"] = newOSType;
        await runningDB.writeComputers(json);

        console.log("OS updated!");
        await delay(300);

        Home();
    }
}

function blankPassword(password: string) {
    return password && password[0] + "*****" + password[password.length - 1];
}

export { edit };
