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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommandNotExpect = exports.runCommandNoExpect = exports.runCommand = void 0;
/**
 * Checks for not expected output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
function runCommandNotExpect(conn, command, not_expected) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const value = yield conn.exec(command);
            if (value.trim().toLowerCase().includes(not_expected)) {
                return value.trim().replace("\n", " ");
            }
            return true;
        }
        catch (error) {
            if (error.trim().toLowerCase().includes(not_expected)) {
                return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
            }
            return true;
        }
    });
}
exports.runCommandNotExpect = runCommandNotExpect;
/**
 * Checks for expected output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
function runCommand(conn, command, expect) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const value = yield conn.exec(command);
            if (!value.trim().toLowerCase().includes(expect)) {
                return value.trim().replace("\n", " ");
            }
            return true;
        }
        catch (error) {
            if (error.toString().trim().toLowerCase().includes(expect)) {
                return true;
            }
            return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
        }
    });
}
exports.runCommand = runCommand;
/**
 * checks for empty output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
function runCommandNoExpect(conn, command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const value = yield conn.exec(command);
            if (value.trim().toLowerCase() != "") {
                return value.trim().replace("\n", " ");
            }
            return true;
        }
        catch (error) {
            return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
        }
    });
}
exports.runCommandNoExpect = runCommandNoExpect;
//# sourceMappingURL=run_command.js.map