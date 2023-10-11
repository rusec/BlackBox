const unameCommand = "uname -a";
const windowsSystemCommand = 'systeminfo | findstr /B /C:"OS Name" /B /C:"OS Version"';
import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";

async function detect_os(conn: SSH2Promise) {
    log(`checking for os ${conn.config[0].host}`, "log");
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
}
export { detect_os };
