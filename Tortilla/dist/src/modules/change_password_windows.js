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
exports.changePasswordWin = void 0;
const debug_1 = require("./util/debug");
const util_1 = require("./util/util");
const socket_commands_1 = __importDefault(require("./util/socket_commands"));
function changePasswordWin(conn, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let useLocalUser = yield check(conn);
            let shell_socket = yield conn.shell();
            try {
                (0, debug_1.log)(`Using ${useLocalUser ? "Get-Local" : "net user"} on ${conn.config[0].host}`, "info");
                if (useLocalUser) {
                    yield socket_commands_1.default.sendCommandExpect(shell_socket, `PowerShell`, `Windows PowerShell`);
                    yield (0, util_1.delay)(3000);
                    yield socket_commands_1.default.sendCommand(shell_socket, `$pass = Read-Host -AsSecureString`);
                    yield socket_commands_1.default.sendInput(shell_socket, `${password}`);
                    yield socket_commands_1.default.sendCommand(shell_socket, `$user = Get-LocalUser "${username}"`);
                    yield socket_commands_1.default.sendCommandNoExpect(shell_socket, `Set-LocalUser -Name $user -Password $pass`, "Unable to update the password");
                }
                else {
                    yield socket_commands_1.default.sendCommandExpect(shell_socket, `net user ${username} *`, "Type a password for the user:");
                    yield (0, util_1.delay)(3000);
                    yield socket_commands_1.default.sendInputExpect(shell_socket, `${password}`, "Retype the password to confirm:");
                    yield socket_commands_1.default.sendInputExpect(shell_socket, `${password}`, "The command completed successfully");
                }
                (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            }
            catch (error) {
                shell_socket.close();
                (0, debug_1.log)(`Unable to change password on ${conn.config[0].host}`, "error");
                return !error.message ? error.toString() : error.message;
            }
            yield socket_commands_1.default.sendCommand(shell_socket, "exit");
            shell_socket.close();
            return true;
        }
        catch (error) {
            return error.message ? error : error.message;
        }
    });
}
exports.changePasswordWin = changePasswordWin;
function check(conn) {
    return __awaiter(this, void 0, void 0, function* () {
        var passed = 2;
        var useLocalUser = true;
        let os_check = yield conn.exec("echo %OS%");
        if (os_check.trim() != "Windows_NT") {
            (0, debug_1.log)(`Windows check error on ${conn.config[0].host} GOT ${os_check} WANTED Windows_NT, Please check for environment vars`, "error");
            passed--;
        }
        let get_local_check;
        try {
            get_local_check = yield conn.exec(`PowerShell -Command "& {Get-LocalUser}"`);
        }
        catch (error) {
            if (error.trim().includes("is not recognized")) {
                (0, debug_1.log)(`Windows check error on ${conn.config[0].host} GOT ${error.substring(0, 30)} WANTED User List, Powershell version might be out of date`, "warn");
                passed--;
                useLocalUser = false;
            }
        }
        (0, debug_1.log)(`Passed ${passed} of 2 tests on ${conn.config[0].host}`, "info");
        return useLocalUser;
    });
}
//# sourceMappingURL=change_password_windows.js.map