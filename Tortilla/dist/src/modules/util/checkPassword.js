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
exports.checkPassword = void 0;
const db_1 = __importDefault(require("./db"));
const inquirer_1 = __importDefault(require("inquirer"));
const clear_1 = __importDefault(require("clear"));
/**
 * Checks and validates a master password stored in the running database or prompts the user to set it if not found.
 * After validating the master password, it allows access to protected functionality.
 *
 * @returns {Promise<void>} A promise that resolves when the password check and validation process is completed.
 */
function checkPassword() {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = yield db_1.default.readPassword();
        if (hash === "") {
            const { master_password } = yield inquirer_1.default.prompt([
                {
                    name: "master_password",
                    type: "input",
                    validate: function (value) {
                        if (value.length > 8) {
                            return true;
                        }
                        return "Password must be longer then 8 characters";
                    },
                    message: "please enter a master password",
                },
            ]);
            yield db_1.default.writePassword(master_password);
        }
        yield (0, clear_1.default)();
        let trials = 3;
        yield inquirer_1.default.prompt([
            {
                name: "master_password",
                type: "password",
                validate: function (value) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const v = yield db_1.default.validateMasterPassword(value);
                        if (trials <= 0) {
                            process.exit(0);
                        }
                        if (!v) {
                            trials--;
                            return "Incorrect Password";
                        }
                        return true;
                    });
                },
            },
        ]);
    });
}
exports.checkPassword = checkPassword;
//# sourceMappingURL=checkPassword.js.map