import SSH2Promise from "ssh2-promise";
import { log } from "../util/debug";
import bcrypt from "bcryptjs";
import { runCommand, runCommandNoExpect } from "../util/run_command";
import { bcryptPassword } from "../util/util";
import { commands } from "../util/commands";

async function changePasswordFreeBSD(conn: SSH2Promise, username: string, password: string) {
    await checks(conn);

    const bcrypt_password = await bcryptPassword(password);
    const host = conn.config[0].host;

    let changedPassword = await runCommand(conn, commands.password.freebsd.step_1(bcrypt_password, username), `user information updated`);
    if (typeof changedPassword != "string") {
        log(`Changed password on ${host}`, "success");
        return true;
    }
    let error = `Unable to use chpass on ${host}. Got: ${changedPassword.trim()}. Please check for alias or no implementation.`;
    log(error, "warn");

    changedPassword = await runCommandNoExpect(conn, commands.password.freebsd.step_2(bcrypt_password, username));
    if (typeof changedPassword != "string") {
        log(`Changed password on ${host}`, "success");
        return true;
    }

    error = `Unable to use usermod on ${host}. Got: ${changedPassword.trim()}. Please check for alias or no implementation.`;
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

async function checks(conn: SSH2Promise) {
    let passed = 1;
    // log(`running security checks on ${conn.config[0].host}`, 'log')
}
