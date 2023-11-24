import inquirer from "inquirer";
import { isValidIPAddress } from "../../modules/util/util";
import runningDB from "../../modules/util/db";
import { pingSSH } from "../../modules/util/ssh_utils";
import { log } from "../../modules/util/debug";
import { delay } from "../../modules/util/util";
import { Home } from "../menu/home";
import { pressEnter } from "../../modules/console/enddingModules";
const addComputer = async function () {
    const { ip, user, pass } = await inquirer.prompt([
        {
            name: "ip",
            message: "please enter an ip:",
            type: "input",
            validate: (v) => {
                var valid = isValidIPAddress(v);
                if (valid) return true;
                return "invalid ip";
            },
        },
        {
            name: "user",
            message: "please enter a username",
            type: "input",
        },
        {
            name: "pass",
            message: "please enter a password",
            type: "input",
        },
    ]);
    var computer_info = await pingSSH(ip, user, pass);

    if (typeof computer_info == "object") {
        await runningDB.addComputer(computer_info.hostname, ip, user, pass, computer_info.operatingSystem);
        log(`Added`, "success");
    } else {
        log(`Unable to reach computer, Not Added`, "error");
    }

    await pressEnter();
};

export { addComputer };
