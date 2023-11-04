import clear from "clear";
import inquirer from "inquirer";
import { sshMenu } from "../page/ssh";
import { addComputer } from "../page/addComputer";
import runningDB from "../../modules/util/db";
import { Home } from "./home";

async function Settings() {
    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
            pageSize: 60,
            choices: [
                new inquirer.Separator(),
                new inquirer.Separator("Computer Setup"),
                "Shotgun Setup",
                "Add Computer",
                "Load CSV",
                new inquirer.Separator(),
                new inquirer.Separator("Passwords"),
                "Reset Master Password",
                new inquirer.Separator(),
                new inquirer.Separator("Navigation"),
                "Back",
            ],
            message: "Please select a setting",
        },
    ]);

    switch (program) {
        case "Shotgun Setup":
            await clear();
            sshMenu();
            break;
        case "Add Computer":
            addComputer();
            break;
        case "Reset Master Password":
            await runningDB.resetMasterPassword();
            await Home();
            break;
        case "Load CSV":
            await runningDB.readCSV();
            Home();
            break;
        case "Back":
            Home();
            break;
    }
}
export { Settings };
