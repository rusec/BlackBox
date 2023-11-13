import SSH2Promise from "ssh2-promise";
import { log } from "../util/debug";
import { commands } from "../util/commands";

const passwd = "/etc/passwd";

// utilize passwd or a password manager like it to change password
async function changePasswordDarwin(conn: SSH2Promise, username: string, oldPassword: string, password: string) {
    try {
        const result = await conn.exec(commands.password.darwin.step_1(username, oldPassword, password));
        if (!result.trim().includes("error")) {
            log(`${conn.config[0].host} Changed password`, "success");
            return true;
        } else {
            const error = `${conn.config[0].host} Unable to change password. Got: ${result.trim()}. Please check for alias or no implementation.`;
            log(error, "error");
            return error;
        }
    } catch (error: any) {
        log(`${conn.config[0].host} Error while changing password: ${error}`, "error");
        return error.message || error.toString();
    }
}

export { changePasswordDarwin };
