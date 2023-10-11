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
exports.changePasswordOf = void 0;
const change_password_linux_1 = require("./change_password_linux");
const change_password_windows_1 = require("./change_password_windows");
const db_1 = __importDefault(require("./util/db"));
const ssh2_promise_1 = __importDefault(require("ssh2-promise"));
const change_password_darwin_1 = require("./change_password_darwin");
const change_password_freeBSD_1 = require("./change_password_freeBSD");
const debug_1 = require("./util/debug");
const options_1 = __importDefault(require("./util/options"));
const detect_os_1 = require("./detect_os");
function changePasswordOf(computer, new_password, save = () => __awaiter(this, void 0, void 0, function* () { })) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!new_password || new_password.length < 8) {
            return "Password does not meet requirements";
        }
        const sshConfig = {
            host: computer["IP Address"],
            username: computer.Username,
            password: computer.Password,
            privateKey: yield db_1.default.getSSHPrivateKey(),
            authHandler: ["password", "publickey"],
            reconnect: false,
            keepaliveInterval: 0,
        };
        const conn = new ssh2_promise_1.default(sshConfig);
        (0, debug_1.log)(`Attempting connection to ${computer["IP Address"]} `, "log");
        try {
            let res;
            yield conn.connect();
            (0, debug_1.log)(`connected to ${computer["IP Address"]}`, "log");
            if (!options_1.default.includes(computer["OS Type"])) {
                let os = yield (0, detect_os_1.detect_os)(conn);
                if (os)
                    computer["OS Type"] = os;
            }
            switch (computer["OS Type"].toLowerCase()) {
                case "windows":
                    res = yield (0, change_password_windows_1.changePasswordWin)(conn, computer.Username, new_password);
                    break;
                case "freebsd":
                    res = yield (0, change_password_freeBSD_1.changePasswordFreeBSD)(conn, computer.Username, new_password);
                    break;
                case "linux":
                    res = yield (0, change_password_linux_1.changePasswordLinux)(conn, computer.Username, new_password, computer.Password);
                    break;
                case "darwin":
                    res = yield (0, change_password_darwin_1.changePasswordDarwin)(conn, computer.Username, computer.Password, new_password);
                    break;
                default:
                    res = "Unknown OS";
                    break;
            }
            // ADD CHECK FOR SSH KEY
            yield conn.close();
            conn.removeAllListeners();
            if (typeof res === "string") {
                return res;
            }
            return yield save();
        }
        catch (error) {
            yield conn.close();
            (0, debug_1.log)(`${conn.config[0].host} Got Error: ${error.message ? error.message : error}`, "error");
            return `Got Error: ${error.message ? error.message : error}`;
        }
    });
}
exports.changePasswordOf = changePasswordOf;
//# sourceMappingURL=passwords.js.map