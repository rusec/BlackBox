import inquirer from "inquirer";
import runningDB from "../../db/db";
import  { ServerInfo } from '../../db/dbtypes'
import clear from "clear";
import { delay } from "../../modules/util/util";
import { changePasswordOf, password_result } from "../../modules/password/change_passwords";
import { log } from "../../modules/console/debug";
import { generatePasses } from "../../modules/util/password-generator";
import fs from "fs";
import { removeANSIColorCodes } from "../../modules/util/util";
import { Home } from "../menu/home";
import logger from "../../modules/console/logger";
import { logToFile, pressEnter } from "../../modules/console/enddingModules";
import { Bar } from "../../modules/console/progress";


let swit = false;
const TEST_PASSWORD = ()=> {
    swit = !swit;
    if(swit){
        return "Password123"
    }
    else return "Password123?"

}
async function runScript(debug?: boolean) {
    const originalConsoleLog = console.log;
    let capturedOutput = "";
    try {
        const computers = await runningDB.readComputers();

        const { seed } = debug
            ? { seed: "" }
            : await inquirer.prompt([
                  {
                      name: "seed",
                      type: "input",
                      message: "Please enter a seed",
                  },
              ]);

        //Hold Original Log for later
        console.log = function (...args) {
            const string = args.map((arg) => String(arg)).join(" ");
            capturedOutput += string + "\n";
            originalConsoleLog(string);
        };

        //Clear and print status
        await clear();
        log(debug ? `Running DEBUG script on ${computers.length} computers` : `Running script on ${computers.length} computers`);
        logger.log(debug ? `Running DEBUG script on ${computers.length} computers` : `Running script on ${computers.length} computers`);
        //Generate values

        const passwords = debug ? computers.map(() => TEST_PASSWORD()) : generatePasses(computers.length, seed);


        let bar = new Bar(computers.length)
        var then = new Date();
        const promises = computers.map(async (element, i) => {
            const password = passwords[i];
            const result = await changePasswordOf(element, password);
            if (typeof result == "string" || result.error) {
                bar.done("Errored " + element.Name+ " " + element["IP Address"])
                throw new Error(typeof result == "string" ? result : result.error ? result.error : "");
            }
            bar.done(element.Name+ " " + element["IP Address"])
            return await runningDB.writeCompResult( element["IP Address"], result);
        });

        var results = await Promise.allSettled(promises);
        var now = new Date();
        const numberOfSuccess = results
            .filter(({ status }) => status === "fulfilled")
            .map((p) => typeof (p as PromiseFulfilledResult<any>).value == "boolean" && (p as PromiseFulfilledResult<any>).value).length;

        var lapse_time = now.getTime() - then.getTime();
        logger.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length} in ${lapse_time} ms`, "info");

        console.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length} in ${lapse_time} ms`.green);

        const runningLog = results
        .map((element, i) => {
            if (typeof (element as PromiseFulfilledResult<any>).value === "boolean" && (element as PromiseFulfilledResult<any>).value) {
                return `Changed password of ${computers[i]["IP Address"]}`;
            } else {
                // console.log(JSON.stringify(element))
                return `Error on ${computers[i]["IP Address"]} ${(element as any).reason}`;
            }
        })
        .join("\n");

        await logToFile(removeANSIColorCodes(runningLog + "\n\nLOG:\n" + capturedOutput))
        bar.stop();
        await delay(1000);
    } catch (error) {
        console.log(`Error while updating passwords ${error}`);
        await delay(1000);
    } finally {
        console.log = originalConsoleLog;

    }
    //Set up reporting


    Home();
}

async function runSingleScript(ip: string) {
    try {
        console.log("Password changing script for one computer");
        const { password } = await inquirer.prompt([
            {
                name: "password",
                type: "password",
                message: "Please enter a new password",
                validate: function (value) {
                    if (value.length > 8) {
                        return true;
                    }
                    return "password must be longer then 8 characters";
                },
            },
        ]);
        const computer = await runningDB.getComputer(ip);
        if(!computer){
            throw new Error("Computer doesn't Exist")
        }
        log(`Running script on ${computer.Name}`, 'info');
        const result = await changePasswordOf(computer, password);

        if (typeof result == "string" || result.error) {
            log(`Error changing password Error: ${typeof result == "string" ? result : result.error ? result.error : ""}`, "error");
            logger.log(`${computer["IP Address"]} Error changing password `, "error");

            await delay(1000);
        } else {
            logger.log(`${computer["IP Address"]} Successfully changed passwords`, "info");

            log(`${computer["IP Address"]} Successfully changed passwords`.green);
            await runningDB.writeCompResult(computer["IP Address"], result);
        }

        await pressEnter()
        
    } catch (error) {
        console.log(`Error while updating passwords ${error}`);
        await delay(1000);
    }

}

export { runScript, runSingleScript };
