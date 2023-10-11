import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";

const passwd = "/etc/passwd";

// utilize passwd or a password manager like it to change password
async function changePasswordDarwin(conn: SSH2Promise, username: string, oldPassword: string, password: string) {
    let changed_password = await conn.exec(`dscl . -passwd /Users/${username} ${oldPassword} ${password}`);
    if (!changed_password.trim().includes("error")) {
        log(`Changed password on ${conn.config[0].host}`, "success");
        return true;
    }
    const error = `unable to change password on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
    log(error, "error");
    return error;
}

export { changePasswordDarwin };
