"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSingleScript = exports.runScript = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const db_1 = __importDefault(require("../modules/util/db"));
const clear_1 = __importDefault(require("clear"));
const util_1 = require("../modules/util/util");
const passwords_1 = require("../modules/passwords");
const debug_1 = require("../modules/util/debug");
const password_generator_1 = require("../modules/password-generator");
const fs_1 = __importDefault(require("fs"));
const util_2 = require("../modules/util/util");
const home_1 = require("./home");
function runScript() {
    return __awaiter(this, void 0, void 0, function* () {
        const originalConsoleLog = console.log;
        let capturedOutput = "";
        try {
            const computers = yield db_1.default.readComputers();
            const { seed } = yield inquirer_1.default.prompt([
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
            yield (0, clear_1.default)();
            (0, debug_1.log)(`running script on ${computers.length} computers`);
            //Generate values
            const passwords = (0, password_generator_1.generatePasses)(computers.length, seed);
            const promises = computers.map((element, i) => {
                const password = passwords[i];
                const callBack = function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        return yield db_1.default.writeCompPassword(i, password);
                    });
                };
                return (0, passwords_1.changePasswordOf)(element, password, callBack);
            });
            var results = yield Promise.allSettled(promises);
            const numberOfSuccess = results
                .filter(({ status }) => status === "fulfilled")
                .map((p) => typeof p.value == "boolean" && p.value).length;
            console.log(`Successfully changed passwords on ${numberOfSuccess} of ${computers.length}`.green);
            const { logToFile } = yield inquirer_1.default.prompt([
                {
                    name: "logToFile",
                    type: "confirm",
                    message: "Would you like to generate a report?",
                },
            ]);
            if (logToFile) {
                const runningLog = results
                    .map((element, i) => {
                    if (typeof element.value === "boolean" && element.value) {
                        return `Changed password of ${computers[i]["IP Address"]}`;
                    }
                    else {
                        return `Error on ${computers[i]["IP Address"]} ${element.value}`;
                    }
                })
                    .join("\n");
                fs_1.default.writeFileSync("log.log", (0, util_2.removeANSIColorCodes)(runningLog + "\n\nLOG:\n" + capturedOutput), "utf8");
            }
            yield (0, util_1.delay)(1000);
        }
        catch (error) {
            console.log(`Error while updating passwords ${error}`);
            yield (0, util_1.delay)(1000);
        }
        finally {
            console.log = originalConsoleLog;
        }
        (0, home_1.Home)();
        //Set up reporting
    });
}
exports.runScript = runScript;
function runSingleScript(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { password } = yield inquirer_1.default.prompt([
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
            const computers = yield db_1.default.readComputers();
            (0, debug_1.log)(`running script on ${computers[id].Name}`);
            let numberOfSuccess = 0;
            const result = yield (0, passwords_1.changePasswordOf)(computers[id], password);
            if (typeof result === "boolean" && result) {
                computers[id].Password = password;
                numberOfSuccess++;
            }
            (0, debug_1.log)(`Successfully changed passwords on ${numberOfSuccess} of 1`.green);
            db_1.default.writeComputers(computers);
        }
        catch (error) {
            console.log(`Error while updating passwords ${error}`);
            yield (0, util_1.delay)(1000);
        }
        (0, home_1.Home)();
    });
}
exports.runSingleScript = runSingleScript;
//# sourceMappingURL=passwordScript.js.map