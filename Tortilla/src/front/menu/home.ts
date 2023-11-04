import inquirer from "inquirer";
import clear from "clear";
import "colors";
import runningDB from "../../modules/util/db";
import { edit } from "../page/editor";
import { runScript } from "../page/passwordScript";
import { checkPassword } from "../../modules/util/checkPassword";
import { Settings } from "./settings";
import { utilsPage } from "./utilsPage";

async function Home() {
    await clear();
    console.log(`Current Computers : ${(await runningDB.readComputers()).length}`.bgGreen);

    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
            pageSize: 60,

            choices: getHomeChoices(),
            message: "Please select the program you want to run:",
        },
    ]);

    switch (program) {
        case "Home":
            Home();
            break;
        case "Run Password Changer":
            await clear();
            await checkPassword();
            runScript();
            break;
        case "Run Password TEST":
            await clear();
            await checkPassword();
            runScript(true);
            break;
        case "Generate Passwords":
            break;
        case "Computers":
            edit();
            break;
        case "Utils":
            utilsPage();
            break;
        case "Settings":
            Settings();
            break;
        case "Exit":
            await clear();
            process.exit(0);
            break;
    }
    function getHomeChoices() {
        if (process.env.DEV && process.pkg == undefined) {
            return [
                new inquirer.Separator(),
                new inquirer.Separator("Passwords"),
                "Run Password Changer",
                "Run Password TEST",
                "Generate Passwords",
                "Utils",
                new inquirer.Separator(),
                new inquirer.Separator("Computers"),
                "Computers",
                new inquirer.Separator(),
                new inquirer.Separator("Navigation"),
                "Settings",
                new inquirer.Separator(),
                "Home",
                "Exit",
            ];
        } else {
            return [
                new inquirer.Separator(),
                new inquirer.Separator("Passwords"),
                "Run Password Changer",
                "Generate Passwords",
                "Utils",
                new inquirer.Separator(),
                new inquirer.Separator("Computers"),
                "Computers",
                new inquirer.Separator(),
                new inquirer.Separator("Navigation"),
                "Settings",
                new inquirer.Separator(),
                "Home",
                "Exit",
            ];
        }
    }
}

export { Home };
