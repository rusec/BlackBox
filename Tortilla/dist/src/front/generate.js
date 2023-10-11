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
exports.generatePasswords = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const clear_1 = __importDefault(require("clear"));
const password_generator_1 = require("../modules/password-generator");
const fs_1 = __importDefault(require("fs"));
const debug_1 = require("../modules/util/debug");
const util_1 = require("../modules/util/util");
const home_1 = require("./home");
function generatePasswords() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, clear_1.default)();
        const { seed, amount } = yield inquirer_1.default.prompt([
            {
                name: "seed",
                type: "input",
                message: "Please enter a seed:",
            },
            {
                name: "amount",
                type: "number",
                filter: function (value) {
                    if (isNaN(value)) {
                        return "";
                    }
                    return value;
                },
                validate: function (value) {
                    if (value > 0) {
                        return true;
                    }
                    return "Please enter a value greater then 0";
                },
            },
        ]);
        let passwords = (0, password_generator_1.generatePasses)(amount, seed);
        for (const password of passwords) {
            console.log(password);
        }
        const { file } = yield inquirer_1.default.prompt([
            {
                name: "file",
                type: "confirm",
                message: "would you like to output to a file?",
            },
        ]);
        if (file) {
            var string = "";
            for (const password of passwords) {
                string += password + "\n";
            }
            fs_1.default.writeFileSync("phone.txt", string, "utf8");
            (0, debug_1.log)("Updated Text File");
            (0, util_1.delay)(300);
        }
        (0, home_1.Home)();
    });
}
exports.generatePasswords = generatePasswords;
//# sourceMappingURL=generate.js.map