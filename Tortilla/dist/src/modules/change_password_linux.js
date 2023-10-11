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
exports.changePasswordLinux = void 0;
const debug_1 = require("./util/debug");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const run_command_1 = require("./util/run_command");
const shadow = "/etc/shadow";
// utilize passwd or a password manager like it to change password
// might want to change to using direct /usr/sbin/chpasswd
function changePasswordLinux(conn, username, password, sudoPassword, algorithm = 6) {
    return __awaiter(this, void 0, void 0, function* () {
        yield checks(conn);
        const newPassword = algorithm === 6 ? encryptPassword(password) : yield bcryptPassword(password);
        const string = `${username}:${newPassword + ""}`;
        let error = true;
        // try without inputting sudo password
        let changedPassword = yield (0, run_command_1.runCommandNoExpect)(conn, `echo '${string}' | sudo chpasswd -e`);
        if (typeof changedPassword != "string") {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        error = `unable to use chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "warn");
        changedPassword = yield (0, run_command_1.runCommandNoExpect)(conn, `echo '${string}' | chpasswd -e`);
        if (typeof changedPassword !== "string") {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        error = `unable to use sudo chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "warn");
        //try with inputting sudo password
        changedPassword = yield (0, run_command_1.runCommandNotExpect)(conn, `echo -e '${sudoPassword}\n${string}' | sudo -S chpasswd -e`, "sorry");
        if (typeof changedPassword !== "string") {
            (0, debug_1.log)(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        }
        error = `unable to use sudo chpasswd on ${conn.config[0].host} got ${changedPassword}, Please check for alias or no implementation`;
        (0, debug_1.log)(error, "error");
        return error;
    });
}
exports.changePasswordLinux = changePasswordLinux;
function bcryptPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Generate a salt (a random string)
            const saltRounds = 10; // You can adjust this according to your needs
            const salt = yield bcryptjs_1.default.genSalt(saltRounds);
            // Hash the password using the salt
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            return hashedPassword;
        }
        catch (error) {
            throw error;
        }
    });
}
function encryptPassword(password) {
    var passwordHash;
    var passwordSalt = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        passwordSalt += possible.charAt(Math.floor(Math.random() * possible.length));
    var sha512crypt = require("sha512crypt-node");
    passwordHash = sha512crypt.sha512crypt(password, passwordSalt);
    return passwordHash;
}
/**
 *
 * @param {ssh2} conn
 * @returns
 */
function checks(conn) {
    return __awaiter(this, void 0, void 0, function* () {
        let passed = 7;
        (0, debug_1.log)(`running security checks on ${conn.config[0].host}`, "log");
        const checkedForShadow = yield (0, run_command_1.runCommand)(conn, `if test -f ${shadow}; then
    echo "File exists.";
  fi`, "file exists");
        if (typeof checkedForShadow === "string") {
            (0, debug_1.log)(`/etc/shadow check error on ${conn.config[0].host} GOT ${checkedForShadow} WANTED file exists, Please check for /etc/shadow`, "error");
            passed--;
        }
        const checkForShadowPermissions = yield (0, run_command_1.runCommand)(conn, `ls -l /etc/shadow`, "-rw-------");
        if (typeof checkForShadowPermissions === "string") {
            (0, debug_1.log)(`/etc/shadow permissions check failed on ${conn.config[0].host} GOT ${checkForShadowPermissions
                .trim()
                .substring(0, 11)} WANTED -rw-------, Please check permissions`, "warn");
            passed--;
        }
        const checkForPasswdPermissions = yield (0, run_command_1.runCommand)(conn, `ls -l /etc/passwd`, "-rw-r--r--");
        if (typeof checkForPasswdPermissions === "string") {
            (0, debug_1.log)(`/etc/passwd permissions check failed on ${conn.config[0].host} GOT ${checkForPasswdPermissions
                .trim()
                .substring(0, 11)} WANTED -rw-------, Please check permissions`, "error");
            passed--;
        }
        let typecheckoptions = yield (0, run_command_1.runCommand)(conn, "type -t", "");
        if (typeof typecheckoptions === "string") {
            (0, debug_1.log)(`type option -t check error on ${conn.config[0].host} GOT ${typecheckoptions} WANTED , Please check for alias or no implementation`, "warn");
            passed--;
        }
        let typecheck = yield (0, run_command_1.runCommand)(conn, "type -t type", "builtin");
        if (typeof typecheck === "string") {
            (0, debug_1.log)(`type check error on ${conn.config[0].host} GOT ${typecheck} WANTED builtin, Please check for alias`, "error");
            passed--;
        }
        let chpasswdCheck = yield (0, run_command_1.runCommand)(conn, "type -t chpasswd", "file");
        if (typeof chpasswdCheck === "string") {
            (0, debug_1.log)(`chpasswd check error on ${conn.config[0].host} GOT ${chpasswdCheck} WANTED file, Please check for alias `, "error");
            passed--;
        }
        let passwdCheck = yield (0, run_command_1.runCommand)(conn, "type -t passwd", "file");
        if (typeof passwdCheck === "string") {
            (0, debug_1.log)(`passwd check error on ${conn.config[0].host} GOT ${passwdCheck} WANTED file, Please check for alias `, "error");
            passed--;
        }
        (0, debug_1.log)(`Passed ${passed} of 7 tests on ${conn.config[0].host}`, "info");
        return chpasswdCheck;
    });
}
//# sourceMappingURL=change_password_linux.js.map