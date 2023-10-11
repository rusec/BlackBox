import SSH2Promise from "ssh2-promise";
import { log } from "./util/debug";
import bcrypt from "bcryptjs";
import { runCommand, runCommandNoExpect } from "./util/run_command";

async function changePasswordFreeBSD(conn: SSH2Promise, username: string, password: string) {
    await checks(conn);

    const bcrypt_password = await bcryptPassword(password);

    let changed_password = await runCommand(conn, `chpass -p '${bcrypt_password + ""}' ${username}`, `user information updated`);
    if (typeof changed_password != "string") {
        log(`Changed password on ${conn.config[0].host}`, "success");
        return true;
    }
    let error = `unable to use chpass on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
    log(error, "warn");

    changed_password = await runCommandNoExpect(conn, `usermod -p '${bcrypt_password + ""}' ${username}`);
    if (typeof changed_password != "string") {
        log(`Changed password on ${conn.config[0].host}`, "success");
        return true;
    }
    error = `unable to use usermod on ${conn.config[0].host} got ${changed_password.trim()}, Please check for alias or no implementation`;
    log(error, "error");
    return error;
}

export { changePasswordFreeBSD };
/**
 * Hashes a password using bcrypt with a generated salt.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} Throws an error if hashing fails.
 */
async function bcryptPassword(password: string): Promise<string> {
    try {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);

        const hashedPassword = await bcrypt.hash(password, salt);

        return hashedPassword;
    } catch (error) {
        throw error;
    }
}

async function checks(conn: SSH2Promise) {
    let passed = 1;
    // log(`running security checks on ${conn.config[0].host}`, 'log')
}
