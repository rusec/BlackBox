import clear from "clear";
import inquirer from "inquirer";
import { sshMenu } from "../page/ssh";
import { addComputer } from "../page/addComputer";
import runningDB from "../../modules/util/db";
import { Home } from "./home";
import {json2csv} from 'json-2-csv';
import fs from 'fs';
import { checkPassword } from "../../modules/util/checkPassword";
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
                "Export DB",
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
            await sshMenu();
            break;
        case "Add Computer":
            await addComputer();
            break;
        case "Reset Master Password":
            await runningDB.resetMasterPassword();
            break;
        case "Load CSV":
            await runningDB.readCSV();
            break;
        case "Export DB":
            await checkPassword()
            let computers = await runningDB.readComputers();
            let json_string = json2csv(computers)
            fs.writeFileSync("./computers.csv", json_string)
            break;
        case "Back":
            break;
    }
    Home();
}
export { Settings };
