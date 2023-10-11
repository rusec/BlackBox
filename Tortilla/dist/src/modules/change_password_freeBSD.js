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
exports.changePasswordFreeBSD = void 0;
const debug_1 = require("./util/debug");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const run_command_1 = require("./util/run_command");
function changePasswordFreeBSD(conn, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        yield checks(conn);
        const bcrypt_password = yield bcryptPassword(password);
        let changed_password = yield (0, run_command_1.runCommand)(conn, `chpass -p '${bcrypt_password + ""}' ${username}`, `user information updated`);
        if (typeof changed_password != "string") {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        let error = `unable to use chpass on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "warn");
        changed_password = yield (0, run_command_1.runCommandNoExpect)(conn, `usermod -p '${bcrypt_password + ""}' ${username}`);
        if (typeof changed_password != "string") {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        error = `unable to use usermod on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "error");
        return error;
    });
}
exports.changePasswordFreeBSD = changePasswordFreeBSD;
/**
 * Hashes a password using bcrypt with a generated salt.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} Throws an error if hashing fails.
 */
function bcryptPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const saltRounds = 10;
            const salt = yield bcryptjs_1.default.genSalt(saltRounds);
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            return hashedPassword;
        }
        catch (error) {
            throw error;
        }
    });
}
function checks(conn) {
    return __awaiter(this, void 0, void 0, function* () {
        let passed = 1;
        // log(`running security checks on ${conn.config[0].host}`, 'log')
    });
}
//# sourceMappingURL=change_password_freeBSD.js.map