import inquirer from "inquirer";
import runningDB, { ServerInfo } from "../../modules/util/db";
import clear from "clear";
import { delay } from "../../modules/util/util";
import { checkPassword } from "../../modules/util/checkPassword";
import { runSingleScript } from "./passwordScript";
import { Home } from "../menu/home";
import {
    addCustomSSH,
    addSSH,
    getStatus,
    makeInteractiveShell,
    makePermanentConnection,
    removeSSH,
    testPassword,
} from "../../modules/util/ssh_utils";
import { changePasswordOf } from "../../modules/password/change_passwords";
import { log } from "../../modules/util/debug";
import logger from "../../modules/util/logger";
import { getEVariables, getFailedLogins, getNetwork, getProcess, getUsers } from "../../modules/computer/compUtils";
import { pressEnter } from "../../modules/console/enddingModules";
import { scanComputer } from "../../modules/computer/scan";
async function edit(id = -1): Promise<void> {
    await clear();
    let json = await runningDB.readComputers();

    var ipAddressesChoices = json.map((v, k) => {
        return { name: v["IP Address"] + "  " + v["OS Type"] + " " + v.Name, value: k };
    });

    if (ipAddressesChoices.length === 0) {
        return Home();
    }

    let selected_id = id;

    if (selected_id == -1 || selected_id >= ipAddressesChoices.length) {
        const { json_id } = await inquirer.prompt([
            {
                name: "json_id",
                type: "list",
                pageSize: 50,

                choices: [...ipAddressesChoices, { name: "Home", value: "home" }],
                message: "Please select a computer:",
            },
        ]);
        if (json_id === "home") {
            return Home();
        }
        selected_id = json_id;
    }
    await clear();
    const computer = json[selected_id];
    const header = `> ${computer.Name} ${computer["IP Address"]} ${computer.Username} ${blankPassword(computer.Password)} ${
        computer["OS Type"]
    } | pub_key: ${computer.ssh_key ? "true" : "false"} password changes: ${computer.password_changes} | Online: ${
        (await getStatus(computer)) ? "Live" : "unable to connect"
    }`.bgBlue;

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
                { name: "Test Password", value: "test_pass" },
                { name: "Utils", value: "utils" },
                new inquirer.Separator("Data"),
                { name: "Change Password (if changed from target)", value: "Change Password" },
                "Change Username",
                "Change OS",
                { name: "Show Password", value: "show_pass" },
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
            message: "Please select one of the following options:",
        },
    ]);

    switch (section) {
        case "Back":
            return edit();
        case "Change Password":
            await checkPassword();
            await changePassword();
            break;
        case "Change Username":
            await changeUsername();
            break;
        case "Change OS":
            await changeOS();
            break;
        case "Remove":
            await Remove();
            break;
        case "utils":
            await computerUtils(computer);
            break;
        case "change_pass_man":
            await checkPassword();
            await runSingleScript(selected_id);
            break;
        case "add_ssh":
            await checkPassword();
            let r = await addSSH(computer);
            if (r) {
                await runningDB.writeCompSSH(selected_id, r);
            }
            break;
        case "test_pass":
            await passwordTest(computer);
            break;
        case "show_pass":
            await checkPassword();
            await showPassword();
            break;
        case "add_custom_ssh":
            await checkPassword();
            await sshCustom();
            break;
        case "remove_ssh":
            await checkPassword();
            let result = await removeSSH(computer);
            if (result) {
                await runningDB.writeCompSSH(selected_id, !result);
            }
            break;
        case "shell":
            await checkPassword();
            await makeInteractiveShell(computer);
            break;
        case "Home":
            return Home();
    }
    return edit(selected_id);

    async function Remove() {
        await clear();
        await checkPassword();
        console.log(header);

        let { confirm } = await inquirer.prompt([
            {
                name: `confirm`,
                message: `confirm removing ${computer.Name} ${computer["IP Address"]}`,
                type: "confirm",
            },
        ]);
        if (!confirm) {
            return;
        }

        await runningDB.removeComputer(selected_id);
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
        let res = await addCustomSSH(computer, ssh_key);
        if (res) {
            log(`INJECTED SSH KEY SUCCESS on ${computer["IP Address"]}`, "success");
            logger.log(`injected ssh key to ${computer["IP Address"]}`);
        } else {
            log(`Unable to inject SSH KEY SUCCESS on ${computer["IP Address"]}`, "error");
            logger.log(`Unable to inject ssh key to ${computer["IP Address"]}`);
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
            return;
        }

        await runningDB.writeCompPassword(selected_id, newPassword);

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
            return;
        }

        json[selected_id].Username = newUsername;
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
            return;
        }

        json[selected_id]["OS Type"] = newOSType;
        await runningDB.writeComputers(json);

        console.log("OS updated!");
        await delay(300);
    }
    async function showPassword() {
        console.log(
            `> ${computer.Name} ${computer["IP Address"]} ${computer.Username} ${computer.Password} ${computer["OS Type"]} | pub_key: ${
                computer.ssh_key ? "true" : "false"
            } password changes: ${computer.password_changes}`.bgBlue
        );
        await pressEnter();
        return;
    }
}
async function passwordTest(server: ServerInfo) {
    await clear();
    const header = `> ${server.Name} ${server["IP Address"]} ${server.Username} ${blankPassword(server.Password)} ${server["OS Type"]} | pub_key: ${
        server.ssh_key ? "true" : "false"
    } password changes: ${server.password_changes}`.bgBlue;
    console.log(header);
    let conn = await makePermanentConnection(server);
    if (!conn) {
        console.log("Unable to connect to server");
        await delay(1000);
        return;
    }
    let pass_success = await testPassword(conn, server.Password);
    pass_success ? log("Password Active", "success") : log("Unable to use Password", "error");

    await pressEnter();
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
                { name: "Get Current Environment Variables", value: "variables" },
                { name: "Scan Computer", value: "scan" },

                "Back",
            ],
        },
    ]);
    if (program == "Back") {
        return;
    }
    let conn = await makePermanentConnection(server);
    if (!conn) {
        console.log("Unable to connect to server");
        await delay(1000);
        return;
    }
    switch (program) {
        case "scan":
            await scanComputer(conn, server["OS Type"]);
            break;
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
        case "variables":
            await getEVariables(conn, server["OS Type"]);
            break;
        default:
            break;
    }
}

function blankPassword(password: string) {
    return password && password[0] + "*****" + password[password.length - 1];
}

export { edit };
