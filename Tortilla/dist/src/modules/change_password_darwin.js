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
exports.changePasswordDarwin = void 0;
const debug_1 = require("./util/debug");
const passwd = "/etc/passwd";
// utilize passwd or a password manager like it to change password
function changePasswordDarwin(conn, username, oldPassword, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let changed_password = yield conn.exec(`dscl . -passwd /Users/${username} ${oldPassword} ${password}`);
        if (!changed_password.trim().includes("error")) {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        const error = `unable to change password on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "error");
        return error;
    });
}
exports.changePasswordDarwin = changePasswordDarwin;
//# sourceMappingURL=change_password_darwin.js.map