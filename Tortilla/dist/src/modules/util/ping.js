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
exports.pingSSH = void 0;
const ssh2 = require("ssh2-promise");
const { detect_os } = require("../detect_os");
/**
 * Attempts to establish an SSH connection to a remote host for the purpose of detecting its operating system.
 *
 * @param {string} ip - The IP address of the remote host.
 * @param {string} username - The SSH username for authentication.
 * @param {string} password - The SSH password for authentication.
 * @returns {Promise<string | boolean>} A promise that resolves to the detected operating system (string) or `true` if the connection was successful but the OS detection failed. Returns `false` if the connection or OS detection failed.
 */
function pingSSH(ip, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sshConfig = {
                host: ip,
                username: username,
                password: password,
                authHandler: ["password"],
                reconnect: false,
                keepaliveInterval: 0,
                readyTimeout: 2000,
            };
            const ssh = new ssh2(sshConfig);
            yield ssh.connect();
            let os = yield detect_os(ssh);
            yield ssh.close();
            return os || true;
        }
        catch (error) {
            return false;
        }
    });
}
exports.pingSSH = pingSSH;
//# sourceMappingURL=ping.js.map