const unameCommand = "uname -a";
const windowsSystemCommand = 'systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"';
import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";
import { options } from "./util/options";

async function detect_os(conn: SSH2Promise): Promise<options> {
    log(`checking for os ${conn.config[0].host}`, "log");
    try {
        const system = await conn.exec(unameCommand);
        const name = system.toLowerCase();

        if (name.includes("linux")) {
            return "linux";
        }
        if (name.includes("is not recognized")) {
            const windowsInfo = await conn.exec(windowsSystemCommand);
            if (windowsInfo.toLowerCase().includes("windows")) return "windows";
        }
        if (name.includes("freebsd") || name.includes("openbsd")) {
            return "freebsd";
        }
        if (name.includes("darwin")) {
            return "darwin";
        }
        return "Unknown";
    } catch (error) {
        if (error instanceof String) {
            if (error.includes("is not recognized")) {
                const windowsInfo = await conn.exec(windowsSystemCommand);
                if (windowsInfo.toLowerCase().includes("windows")) return "windows";
            }
        }
        return "Unknown";
    }
}
export { detect_os };
