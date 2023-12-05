import { clear } from "console";
import runningDB, { ServerInfo } from "../../modules/util/db";
import { Home } from "../menu/home";
import inquirer from "inquirer";
import { checkPassword } from "../../modules/util/checkPassword";
import { makeConnection, makePermanentConnection } from "../../modules/util/ssh_utils";
import delay from "delay";
import { log } from "../../modules/util/debug";
import { getOutput } from "../../modules/util/run_command";
import fs from 'fs'
import { logToFile } from "../../modules/console/enddingModules";
async function Commands() {
    await clear();
    await checkPassword();
    let json = await runningDB.readComputers();

    var ipAddressesChoices = json.map((v, k) => {
        return { name: v["IP Address"] + "  " + v["OS Type"] + " " + v.Name, value: v };
    });

    if (ipAddressesChoices.length === 0) {
        return Home();
    }
    const { computers, command } = await inquirer.prompt([
        {
            name: "computers",
            type: "checkbox",
            pageSize: 50,
            choices: [...ipAddressesChoices],
            message: "Please select the computers youd like to target:",
        },
        {
            name: "command",
            type: "input",
            message: "Please type the command",
        },
    ]);
    await shotgunCommands(computers, command);

    Home();
}

async function shotgunCommands(servers: ServerInfo[], command: string) {
    let fileLOG = "LOG FOR COMMANDS RUN\n";
    for (let id = 0; id < servers.length; id++) {
        try {
            let server = servers[id];
            fileLOG += `Running Command for ${server["IP Address"]} ${server.Name}\n`
            let conn = await makePermanentConnection(server, true);
            if (!conn) {
                log(`${server["IP Address"]} Unable to Connect to Host`, "error");

                continue;
            }
            let output = await getOutput(conn, command);
            log(`${server["IP Address"]} Successful LOG:\n${output}`, 'success')
            fileLOG += `${server["IP Address"]} Successful Ran Command\nLOG:\n${output}\n`;
        } catch (error) {}
        log(`${id +1} of ${servers.length} Done`);
    }
    await logToFile(fileLOG)


}

export { Commands };
