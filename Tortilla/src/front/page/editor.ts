import inquirer from "inquirer";
import runningDB, { ServerInfo } from "../../modules/util/db";
import clear from "clear";
import { delay } from "../../modules/util/util";
import { checkPassword } from "../../modules/util/checkPassword";
import { runSingleScript } from "./passwordScript";
import { Home } from "../menu/home";
import { addCustomSSH, addSSH, makeConnection, makeInteractiveShell, removeSSH, removeSSHkey } from "../../modules/util/ssh_utils";
import { changePasswordOf } from "../../modules/password/change_passwords";
import { log } from "../../modules/util/debug";
import logger from "../../modules/util/logger";
import { getFailedLogins, getNetwork, getProcess, getUsers } from "../../modules/computer_utils/compUtils";
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

            choices: [...ipAddressesChoices, { name: "Home", value: "home" }],
            message: "Please select a computer:",
        },
    ]);
    if (id === "home") {
        Home();
        return;
    }
    const header = `> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${
        json[id]["OS Type"]
    } | pub_key: ${json[id].ssh_key ? "true" : "false"} password changes: ${json[id].password_changes}`.bgBlue;

    await clear();
    console.log(header);

    const { section } = await inquirer.prompt([
        {
            name: "section",
            type: "list",
            pageSize: 50,

            choices: [
                new inquirer.Separator("Connect"),
                { name: "Start Shell", value: "shell" },
                { name: "Change Password", value: "change_pass_man" },
                { name: "Utils", value: "utils" },
                new inquirer.Separator("Data"),
                { name: "Change Password (if changed from target)", value: "Change Password" },
                "Change Username",
                "Change OS",
                { name: "Remove Computer", value: "Remove" },
                new inquirer.Separator("SSH"),
                { name: "Inject SSH Key", value: "add_ssh" },
                { name: "Inject Custom SSH Key", value: "add_custom_ssh" },
                { name: "Remove SSH Key", value: "remove_ssh" },
                new inquirer.Separator(),
                new inquirer.Separator("Navigation"),
                "Back",
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
            await changeUsername();
            edit();
            break;
        case "Change OS":
            await changeOS();
            edit();
            break;
        case "Remove":
            await Remove();
            edit();
            break;
        case "utils":
            computerUtils(json[id]);
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
        case "add_custom_ssh":
            await checkPassword();
            await sshCustom();
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
        case "shell":
            await checkPassword();
            await makeInteractiveShell(json[id]);
            Home();
            break;
        case "Home":
            Home();
            break;
    }

    async function Remove() {
        await clear();
        await checkPassword();
        console.log(header);

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
    }
    async function sshCustom() {
        const { ssh_key } = await inquirer.prompt([
            {
                name: "ssh_key",
                message: "please enter an ssh key",
                validate: function isValidSSHPublicKey(publicKey) {
                    const sshPublicKeyRegex = /^(ssh-rsa|ssh-dss|ecdsa-[a-zA-Z0-9]+)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/;

                    return sshPublicKeyRegex.test(publicKey.trim()) ? true : "Invalid SSH KEY";
                },
                filter: (input) => {
                    return input.trim();
                },
            },
        ]);
        let res = await addCustomSSH(json[id], ssh_key);
        if (res) {
            log(`INJECTED SSH KEY SUCCESS on ${json[id]["IP Address"]}`, "success");
            logger.log(`injected ssh key to ${json[id]["IP Address"]}`);
        } else {
            log(`Unable to inject SSH KEY SUCCESS on ${json[id]["IP Address"]}`, "error");
            logger.log(`Unable to inject ssh key to ${json[id]["IP Address"]}`);
        }
        await delay(1000);
    }
    async function changePassword() {
        let { newPassword, confirm } = await inquirer.prompt([
            {
                name: "newPassword",
                message: "new password if manually changed",
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
    }
}
async function computerUtils(server: ServerInfo) {
    await clear();
    const header = `> ${server.Name} ${server["IP Address"]} ${server.Username} ${blankPassword(server.Password)} ${server["OS Type"]} | pub_key: ${
        server.ssh_key ? "true" : "false"
    } password changes: ${server.password_changes}`.bgBlue;
    console.log(header);
    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
            pageSize: 50,
            message: "Please select a command to run",
            choices: [
                { name: "Get Computers Users", value: "users" },
                { name: "Get Failed Logins Event", value: "failedLogins" },
                { name: "Get Current Network Connections", value: "network" },
                { name: "Get Current Process", value: "processes" },
            ],
        },
    ]);
    let conn = await makeConnection(server);
    if (!conn) {
        console.log("Unable to connect to server");
        await delay(1000);
        return edit();
    }
    switch (program) {
        case "users":
            await getUsers(conn, server["OS Type"]);
            break;
        case "failedLogins":
            await getFailedLogins(conn, server["OS Type"]);
            break;
        case "network":
            await getNetwork(conn, server["OS Type"]);
            break;
        case "processes":
            await getProcess(conn, server["OS Type"]);
            break;
        default:
            break;
    }
    await conn.close();

    edit();
}

function blankPassword(password: string) {
    return password && password[0] + "*****" + password[password.length - 1];
}

export { edit };
