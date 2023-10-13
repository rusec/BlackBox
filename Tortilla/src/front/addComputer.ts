import inquirer from "inquirer";
import { isValidIPAddress } from "../modules/util/util";
import runningDB from "../modules/util/db";
import { pingSSH } from "../modules/util/ssh_utils";
import { log } from "../modules/util/debug";
import { delay } from "../modules/util/util";
import { Home } from "./home";
const addComputer = async function () {
    const { name, ip, user, pass } = await inquirer.prompt([
        {
            name: "name",
            message: "please enter a name:",
            type: "input",
        },
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
    var os_type = await pingSSH(ip, user, pass);

    if (typeof os_type == "string") {
        await runningDB.addComputer(name, ip, user, pass, os_type);
        log(`Added`, "success");
    } else {
        log(`Unable to reach computer, Not Added`, "error");
    }

    await delay(1000);
    Home();
};

export { addComputer };
