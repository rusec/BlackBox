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
exports.detect_os = void 0;
const unameCommand = "uname -a";
const windowsSystemCommand = 'systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"';
const debug_1 = require("./util/debug");
function detect_os(conn) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, debug_1.log)(`checking for os ${conn.config[0].host}`, "log");
        const system = yield conn.exec(unameCommand);
        const name = system.toLowerCase();
        if (name.includes("linux")) {
            return "linux";
        }
        if (name.includes("is not recognized")) {
            const windowsInfo = yield conn.exec(windowsSystemCommand);
            if (windowsInfo.toLowerCase().includes("windows"))
                return "windows";
        }
        if (name.includes("freebsd") || name.includes("openbsd")) {
            return "freebsd";
        }
        if (name.includes("darwin")) {
            return "darwin";
        }
    });
}
exports.detect_os = detect_os;
//# sourceMappingURL=detect_os.js.map