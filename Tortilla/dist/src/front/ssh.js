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
exports.sshMenu = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const db_1 = __importDefault(require("../modules/util/db"));
const util_1 = require("../modules/util/util");
const ping_1 = require("../modules/util/ping");
const debug_1 = require("../modules/util/debug");
const util_2 = __importDefault(require("util"));
const exec = util_2.default.promisify(require("node:child_process").exec);
function sshMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        const { computers_string, usernames_string, passwords_string } = yield inquirer_1.default.prompt([
            {
                name: "computers_string",
                value: "input",
                /**
                 *
                 * @param {string} v
                 */
                validate: (v) => {
                    var strings = v.split(",");
                    var computers = strings.map((v) => {
                        var filtered_string = v.trim().split(" ");
                        return {
                            name: filtered_string[0] || "",
                            ip: filtered_string[1] || "",
                        };
                    });
                    for (const computer of computers) {
                        if (!(computer.name.length > 1 && (0, util_1.isValidIPAddress)(computer.ip))) {
                            return "Please enter in format {Name} {IP},";
                        }
                    }
                    return true;
                },
                message: "please enter a list of names and ips separated by commas (separated by commas)",
            },
            {
                name: "usernames_string",
                value: "input",
                message: "please enter a list of usernames (separated by commas)",
            },
            {
                name: "passwords_string",
                value: "input",
                message: "please enter a list of passwords (separated by commas)",
            },
        ]);
        var computers = computers_string.split(",").map((v) => {
            var filtered_string = v.trim().split(" ");
            return {
                name: filtered_string[0] || "",
                ip: filtered_string[1] || "",
            };
        });
        var usernames = usernames_string.split(",").map((v) => v.trim());
        var passwords = passwords_string.split(",").map((v) => v.trim());
        var users_sessions = usernames.map((user) => {
            return passwords.map((pass) => {
                return {
                    user: user,
                    pass: pass,
                };
            });
        });
        let sessions = [];
        for (const users of users_sessions)
            for (let session of users) {
                sessions.push(session);
            }
        var promises = computers.map((computer) => __awaiter(this, void 0, void 0, function* () {
            var passed = false;
            (0, debug_1.log)(`Attempting to login ${computer.ip} using ${sessions.length} sessions`, "info");
            for (const session of sessions) {
                var os_type = yield (0, ping_1.pingSSH)(computer.ip, session.user, session.pass);
                if (typeof os_type == "string") {
                    (0, debug_1.log)(`Found valid session for ${computer.ip} saving...`, "success");
                    yield db_1.default.addComputer(computer.name, computer.ip, session.user, session.pass, os_type);
                    passed = true;
                }
            }
            if (!passed) {
                (0, debug_1.log)(`Unable to login, invalid user pass combo ${computer.ip}`, "error");
            }
            return passed;
        }));
        yield Promise.allSettled(promises);
        const { logHost } = yield inquirer_1.default.prompt([
            {
                name: "logHost",
                type: "confirm",
                message: "Would you like to append you computers host file.(requires admin)",
            },
        ]);
        if (logHost) {
            var string = "\n";
            for (const computer of computers) {
                string += `${computer.ip}     ${computer.name}\n`;
            }
            if (process.platform === "linux" || process.platform === "darwin" || process.platform === "freebsd" || process.platform === "openbsd") {
                yield exec(`echo '${string}' | sudo tee -a /etc/hosts`);
            }
            if (process.platform === "win32") {
                // add windows host input
                // await exec(`echo '${string}' | tee -a /etc/hosts`)
            }
        }
    });
}
exports.sshMenu = sshMenu;
//# sourceMappingURL=ssh.js.map