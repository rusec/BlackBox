import clear from "clear";
import inquirer from "inquirer";
import { sshMenu } from "./ssh";
import { addComputer } from "./addComputer";
import runningDB from "../modules/util/db";
import { Home } from "./home";
async function Settings() {
    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
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
            message: "Please select a setting",
        },
    ]);

    switch (program) {
        case "Setup":
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
