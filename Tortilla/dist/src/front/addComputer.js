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
exports.addComputer = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const util_1 = require("../modules/util/util");
const db_1 = __importDefault(require("../modules/util/db"));
const ping_1 = require("../modules/util/ping");
const debug_1 = require("../modules/util/debug");
const util_2 = require("../modules/util/util");
const home_1 = require("./home");
const addComputer = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, ip, user, pass } = yield inquirer_1.default.prompt([
            {
                name: "name",
                message: "please enter a name:",
                type: "input",
            },
            {
                name: "ip",
                message: "please enter an ip:",
                type: "input",
                validate: (v) => {
                    var valid = (0, util_1.isValidIPAddress)(v);
                    if (valid)
                        return true;
                    return "invalid ip";
                },
            },
            {
                name: "user",
                message: "please enter a username",
                type: "input",
            },
            {
                name: "pass",
                message: "please enter a password",
                type: "input",
            },
        ]);
        var os_type = yield (0, ping_1.pingSSH)(ip, user, pass);
        if (typeof os_type == "string") {
            yield db_1.default.addComputer(name, ip, user, pass, os_type);
        }
        else {
            (0, debug_1.log)("unable to add computer, invalid", "error");
            yield (0, util_2.delay)(1000);
        }
        (0, home_1.Home)();
    });
};
exports.addComputer = addComputer;
//# sourceMappingURL=addComputer.js.map