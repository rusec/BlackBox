import inquirer from "inquirer";
import fs from "fs";

async function logToFile(str: string) {
    const { continueLog } = await inquirer.prompt([
        {
            name: "continueLog",
            type: "confirm",
            message: "Would you like to log to file?",
        },
    ]);
    if (continueLog) {
        fs.writeFileSync("log.log", str, "utf8");
    }
}
async function pressEnter() {
    await inquirer.prompt([
        {
            name: "confirm",
            type: "input",
            message: "Press Enter to Continue",
        },
    ]);
}

export { logToFile, pressEnter };
