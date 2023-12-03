import inquirer from "inquirer";
import runningDB, { ServerInfo } from "../../modules/util/db";
import clear from "clear";
import { delay } from "../../modules/util/util";
import { changePasswordOf, password_result } from "../../modules/password/change_passwords";
import { log } from "../../modules/util/debug";
import { generatePasses } from "../../modules/util/password-generator";
import fs from "fs";
import { removeANSIColorCodes } from "../../modules/util/util";
import { Home } from "../menu/home";
import logger from "../../modules/util/logger";
import { logToFile, pressEnter } from "../../modules/console/enddingModules";
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

        //Generate values

        const passwords = debug ? computers.map(() => "Password123") : generatePasses(computers.length, seed);

        const promises = computers.map(async (element, i) => {
            const password = passwords[i];
            const result = await changePasswordOf(element, password);
            if (typeof result == "string" || result.error) {
                throw new Error(typeof result == "string" ? result : result.error ? result.error : "");
            }
            return await runningDB.writeCompResult(i, result);
        });

        var results = await Promise.allSettled(promises);
        const numberOfSuccess = results
            .filter(({ status }) => status === "fulfilled")
            .map((p) => typeof (p as PromiseFulfilledResult<any>).value == "boolean" && (p as PromiseFulfilledResult<any>).value).length;
        logger.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length}`, "info");

        console.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length}`.green);

        const runningLog = results
        .map((element, i) => {
            if (typeof (element as PromiseFulfilledResult<any>).value === "boolean" && (element as PromiseFulfilledResult<any>).value) {
                return `Changed password of ${computers[i]["IP Address"]}`;
            } else {
                return `Error on ${computers[i]["IP Address"]} ${(element as PromiseFulfilledResult<any>).value}`;
            }
        })
        .join("\n");

        await logToFile(removeANSIColorCodes(runningLog + "\n\nLOG:\n" + capturedOutput))

        await delay(1000);
    } catch (error) {
        console.log(`Error while updating passwords ${error}`);
        await delay(1000);
    } finally {
        console.log = originalConsoleLog;
    }
    //Set up reporting
}

async function runSingleScript(id: number) {
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
        const computers = await runningDB.readComputers();
        log(`Running script on ${computers[id].Name}`);
        const result = await changePasswordOf(computers[id], password);

        if (typeof result == "string" || result.error) {
            log(`Error changing password Error: ${typeof result == "string" ? result : result.error ? result.error : ""}`, "error");
            logger.log(`${computers[id]["IP Address"]} Error changing password `, "error");

            await delay(1000);
        } else {
            logger.log(`${computers[id]["IP Address"]} Successfully changed passwords`, "info");

            log(`${computers[id]["IP Address"]} Successfully changed passwords`.green);
            await runningDB.writeCompResult(id, result);
        }

        await pressEnter()
        
    } catch (error) {
        console.log(`Error while updating passwords ${error}`);
        await delay(1000);
    }
}

export { runScript, runSingleScript };
