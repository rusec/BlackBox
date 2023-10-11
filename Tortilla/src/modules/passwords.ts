import SSHConfig from "ssh2-promise/lib/sshConfig";
import { changePasswordLinux } from "./change_password_linux";
import { changePasswordWin } from "./change_password_windows";
import runningDB, { ServerInfo } from "./util/db";
import SSH2Promise from "ssh2-promise";
import { changePasswordDarwin } from "./change_password_darwin";
import { changePasswordFreeBSD } from "./change_password_freeBSD";
import { log } from "./util/debug";
import options from "./util/options";
import { detect_os } from "./detect_os";

async function changePasswordOf(computer: ServerInfo, new_password: string, save: () => any = async () => {}): Promise<boolean | string> {
    if (!new_password || new_password.length < 8) {
        return "Password does not meet requirements";
    }

    const sshConfig: SSHConfig = {
        host: computer["IP Address"],
        username: computer.Username,
        password: computer.Password,
        privateKey: await runningDB.getSSHPrivateKey(),
        authHandler: ["password", "publickey"],
        reconnect: false,
        keepaliveInterval: 0,
    };
    const conn = new SSH2Promise(sshConfig);
    log(`Attempting connection to ${computer["IP Address"]} `, "log");
    try {
        let res;

        await conn.connect();
        log(`connected to ${computer["IP Address"]}`, "log");
        if (!options.includes(computer["OS Type"])) {
            let os = await detect_os(conn);
            if (os) computer["OS Type"] = os;
        }

        switch (computer["OS Type"].toLowerCase()) {
            case "windows":
                res = await changePasswordWin(conn, computer.Username, new_password);
                break;
            case "freebsd":
                res = await changePasswordFreeBSD(conn, computer.Username, new_password);
                break;
            case "linux":
                res = await changePasswordLinux(conn, computer.Username, new_password, computer.Password);
                break;
            case "darwin":
                res = await changePasswordDarwin(conn, computer.Username, computer.Password, new_password);
                break;
            default:
                res = "Unknown OS";
                break;
        }

        // ADD CHECK FOR SSH KEY

        await conn.close();

        conn.removeAllListeners();
        if (typeof res === "string") {
            return res;
        }
        return await save();
    } catch (error: any) {
        await conn.close();
        log(`${conn.config[0].host} Got Error: ${error.message ? error.message : error}`, "error");
        return `Got Error: ${error.message ? error.message : error}`;
    }
}

export { changePasswordOf };
