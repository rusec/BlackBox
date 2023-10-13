import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";
import { options } from "./util/options";
import { commands } from "./util/commands";

async function detect_os(conn: SSH2Promise): Promise<options> {
    log(`checking for os ${conn.config[0].host}`, "log");
    try {
        const system = await conn.exec(commands.detect.linux);
        const name = system.toLowerCase();

        if (name.includes("linux")) {
            return "linux";
        } else if (name.includes("freebsd") || name.includes("openbsd")) {
            return "freebsd";
        } else if (name.includes("darwin")) {
            return "darwin";
        } else {
            const windowsInfo = await conn.exec(commands.detect.windows);
            if (windowsInfo.toLowerCase().includes("windows")) {
                return "windows";
            }
            return "Unknown";
        }
    } catch (error) {
        if (typeof error === "string" && error.toLowerCase().includes("is not recognized")) {
            const windowsInfo = await conn.exec(commands.detect.windows);
            if (windowsInfo.toLowerCase().includes("windows")) {
                return "windows";
            }
        }
        return "Unknown";
    }
}
export { detect_os };
