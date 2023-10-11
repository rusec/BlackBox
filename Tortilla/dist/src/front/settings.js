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
exports.Settings = void 0;
const clear_1 = __importDefault(require("clear"));
const inquirer_1 = __importDefault(require("inquirer"));
const ssh_1 = require("./ssh");
const addComputer_1 = require("./addComputer");
const db_1 = __importDefault(require("../modules/util/db"));
const home_1 = require("./home");
function Settings() {
    return __awaiter(this, void 0, void 0, function* () {
        const { program } = yield inquirer_1.default.prompt([
            {
                name: "program",
                type: "list",
                pageSize: 60,
                choices: [
                    new inquirer_1.default.Separator(),
                    "Setup",
                    new inquirer_1.default.Separator(),
                    "Add Computer",
                    new inquirer_1.default.Separator(),
                    "Reset Master Password",
                    new inquirer_1.default.Separator(),
                    "Load CSV",
                    new inquirer_1.default.Separator(),
                    "Back",
                    new inquirer_1.default.Separator(),
                ],
                message: "Please select a setting",
            },
        ]);
        switch (program) {
            case "Setup":
                yield (0, clear_1.default)();
                (0, ssh_1.sshMenu)();
                break;
            case "Add Computer":
                (0, addComputer_1.addComputer)();
                break;
            case "Reset Master Password":
                yield db_1.default.resetMasterPassword();
                yield (0, home_1.Home)();
                break;
            case "Load CSV":
                yield db_1.default.readCSV();
                (0, home_1.Home)();
                break;
            case "Back":
                (0, home_1.Home)();
                break;
        }
    });
}
exports.Settings = Settings;
//# sourceMappingURL=settings.js.map