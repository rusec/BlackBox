import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";
import { commands } from "./util/commands";

const passwd = "/etc/passwd";

// utilize passwd or a password manager like it to change password
async function changePasswordDarwin(conn: SSH2Promise, username: string, oldPassword: string, password: string) {
    try {
        const result = await conn.exec(commands.password.darwin.step_1(username, oldPassword, password));
        if (!result.trim().includes("error")) {
            log(`Changed password on ${conn.config[0].host}`, "success");
            return true;
        } else {
            const error = `Unable to change password on ${conn.config[0].host}. Got: ${result.trim()}. Please check for alias or no implementation.`;
            log(error, "error");
            return error;
        }
    } catch (error: any) {
        log(`Error while changing password on ${conn.config[0].host}: ${error}`, "error");
        return error.message || error.toString();
    }
}

export { changePasswordDarwin };
