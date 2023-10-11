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
exports.Home = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const clear_1 = __importDefault(require("clear"));
require("colors");
const db_1 = __importDefault(require("../modules/util/db"));
const editor_1 = require("./editor");
const generate_1 = require("./generate");
const passwordScript_1 = require("./passwordScript");
const checkPassword = require("../modules/util/checkPassword");
const { Settings } = require("./settings");
function Home() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, clear_1.default)();
        console.log(`Current Computers : ${(yield db_1.default.readComputers()).length}`.bgGreen);
        const { program } = yield inquirer_1.default.prompt([
            {
                name: "program",
                type: "list",
                pageSize: 60,
                choices: [
                    new inquirer_1.default.Separator(),
                    "Home",
                    new inquirer_1.default.Separator(),
                    "Run Password Changer",
                    new inquirer_1.default.Separator(),
                    "Computers",
                    new inquirer_1.default.Separator(),
                    "Generate Passwords",
                    new inquirer_1.default.Separator(),
                    "Settings",
                    new inquirer_1.default.Separator(),
                    "Exit",
                    new inquirer_1.default.Separator(),
                ],
                message: "Please select the program you want to run:",
            },
        ]);
        switch (program) {
            case "Home":
                Home();
                break;
            case "Run Password Changer":
                yield (0, clear_1.default)();
                yield checkPassword();
                (0, passwordScript_1.runScript)();
                break;
            case "Generate Passwords":
                (0, generate_1.generatePasswords)();
                break;
            case "Computers":
                (0, editor_1.edit)();
                break;
            case "Settings":
                Settings();
                break;
            case "Exit":
                yield (0, clear_1.default)();
                process.exit(0);
                break;
        }
    });
}
exports.Home = Home;
//# sourceMappingURL=home.js.map