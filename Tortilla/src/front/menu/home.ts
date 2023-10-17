import inquirer from "inquirer";
import clear from "clear";
import "colors";
import runningDB from "../../modules/util/db";
import { edit } from "../page/editor";
import { generatePasswords } from "../page/generate";
import { runScript } from "../page/passwordScript";
import { checkPassword } from "../../modules/util/checkPassword";
import { Settings } from "./settings";

async function Home() {
    await clear();
    console.log(`Current Computers : ${(await runningDB.readComputers()).length}`.bgGreen);

    const { program } = await inquirer.prompt([
        {
            name: "program",
            type: "list",
            pageSize: 60,

            choices: [
                new inquirer.Separator(),
                new inquirer.Separator("Passwords"),
                "Run Password Changer",
                "Run Password TEST",
                "Generate Passwords",
                new inquirer.Separator(),
                new inquirer.Separator("Computers"),
                "Computers",
                new inquirer.Separator(),
                new inquirer.Separator("Navigation"),
                "Settings",
                new inquirer.Separator(),
                "Home",
                "Exit",
            ],
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
            generatePasswords();
            break;
        case "Computers":
            edit();
            break;
        case "Settings":
            Settings();
            break;
        case "Exit":
            await clear();
            process.exit(0);
            break;
    }
}

export { Home };
