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
exports.edit = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const db_1 = __importDefault(require("../modules/util/db"));
const clear_1 = __importDefault(require("clear"));
const util_1 = require("../modules/util/util");
const checkPassword_1 = require("../modules/util/checkPassword");
const passwordScript_1 = require("./passwordScript");
const home_1 = require("./home");
function edit() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, clear_1.default)();
        let json = yield db_1.default.readComputers();
        var ipAddressesChoices = json.map((v, k) => {
            return { name: v["IP Address"] + "  " + v["OS Type"] + " " + v.Name, value: k };
        });
        if (ipAddressesChoices.length === 0) {
            return (0, home_1.Home)();
        }
        const { id } = yield inquirer_1.default.prompt([
            {
                name: "id",
                type: "list",
                pageSize: 50,
                choices: ipAddressesChoices,
                message: "Please select the IP Address you want to edit:",
            },
        ]);
        yield (0, clear_1.default)();
        console.log(`> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${json[id]["OS Type"]} `.bgBlue);
        const { section } = yield inquirer_1.default.prompt([
            {
                name: "section",
                type: "list",
                pageSize: 50,
                choices: [
                    new inquirer_1.default.Separator(),
                    "Back",
                    new inquirer_1.default.Separator(),
                    { name: "Change Password (if manually changed)", value: "Change Password" },
                    new inquirer_1.default.Separator(),
                    "Change Username",
                    new inquirer_1.default.Separator(),
                    "Change OS",
                    new inquirer_1.default.Separator(),
                    "Run Password Changer",
                    new inquirer_1.default.Separator(),
                    "Remove",
                    new inquirer_1.default.Separator(),
                    "Home",
                    new inquirer_1.default.Separator(),
                ],
                message: "Please select a computer:",
            },
        ]);
        switch (section) {
            case "Back":
                edit();
                break;
            case "Change Password":
                changePassword();
                break;
            case "Change Username":
                changeUsername();
                break;
            case "Change OS":
                changeOS();
                break;
            case "Remove":
                Remove();
                break;
            case "Run Password Changer":
                yield (0, checkPassword_1.checkPassword)();
                yield (0, passwordScript_1.runSingleScript)(id);
                break;
            case "Home":
                (0, home_1.Home)();
                break;
        }
        function Remove() {
            return __awaiter(this, void 0, void 0, function* () {
                yield (0, clear_1.default)();
                yield (0, checkPassword_1.checkPassword)();
                console.log(`> ${json[id].Name} ${json[id]["IP Address"]} ${json[id].Username} ${blankPassword(json[id].Password)} ${json[id]["OS Type"]} `.bgBlue);
                let { confirm } = yield inquirer_1.default.prompt([
                    {
                        name: "confirm",
                        type: "confirm",
                    },
                ]);
                if (!confirm) {
                    return edit();
                }
                yield db_1.default.removeComputer(id);
                return (0, home_1.Home)();
            });
        }
        function changePassword() {
            return __awaiter(this, void 0, void 0, function* () {
                let { newPassword, confirm } = yield inquirer_1.default.prompt([
                    {
                        name: "newPassword",
                        message: "new password",
                        type: "input",
                    },
                    {
                        name: "confirm",
                        type: "confirm",
                    },
                ]);
                if (!confirm) {
                    return (0, home_1.Home)();
                }
                yield db_1.default.writeCompPassword(id, newPassword);
                console.log("password updated!");
                yield (0, util_1.delay)(300);
                (0, home_1.Home)();
            });
        }
        function changeUsername() {
            return __awaiter(this, void 0, void 0, function* () {
                let { newUsername, confirm } = yield inquirer_1.default.prompt([
                    {
                        name: "newUsername",
                        type: "input",
                    },
                    {
                        name: "confirm",
                        type: "confirm",
                    },
                ]);
                if (!confirm) {
                    return (0, home_1.Home)();
                }
                json[id].Username = newUsername;
                yield db_1.default.writeComputers(json);
                console.log("username updated!");
                yield (0, util_1.delay)(300);
                (0, home_1.Home)();
            });
        }
        function changeOS() {
            return __awaiter(this, void 0, void 0, function* () {
                let { newOSType, confirm } = yield inquirer_1.default.prompt([
                    {
                        name: "newOSType",
                        type: "list",
                        choices: [
                            { name: "General Linux (ubuntu like) uses ch", value: "linux" },
                            { name: "Windows or Windows Server", value: "windows" },
                            { name: "FreeBSD or OpenBSD", value: "freeBSD" },
                            { name: "darwin or macos", value: "darwin" },
                        ],
                    },
                    {
                        name: "confirm",
                        type: "confirm",
                    },
                ]);
                if (!confirm) {
                    return (0, home_1.Home)();
                }
                json[id]["OS Type"] = newOSType;
                yield db_1.default.writeComputers(json);
                console.log("OS updated!");
                yield (0, util_1.delay)(300);
                (0, home_1.Home)();
            });
        }
    });
}
exports.edit = edit;
function blankPassword(password) {
    return password && password[0] + "*****" + password[password.length - 1];
}
//# sourceMappingURL=editor.js.map