import SSH2Promise from "ssh2-promise";
import { log, options } from "../util/debug";
import { runCommand, runCommandNoExpect, runCommandNotExpect } from "../util/run_command";
import { bcryptPassword, encryptPassword } from "../util/util";
import { commands } from "../util/commands";

const shadow = "/etc/shadow";

// utilize passwd or a password manager like it to change password
// might want to change to using direct /usr/sbin/chpasswd
async function changePasswordLinux(conn: SSH2Promise, username: string, password: string, sudoPassword: string, algorithm = 6) {
    await checks(conn);
    const host = conn.config[0].host;
    const newPassword = algorithm === 6 ? encryptPassword(password) : await bcryptPassword(password);
    const string = `${username}:${newPassword + ""}`;

    let error: boolean | string = true;
    // Try changing the password without inputting the sudo password first.
    let changedPassword = await runCommandNoExpect(conn, commands.password.linux.step_1(string));
    if (typeof changedPassword != "string") {
        log(`${host} Changed password`, "success");
        return true;
    }
    error = `${host} Unable to use chpasswd. Got: ${changedPassword}. Please check for alias or no implementation.`;
    log(error, "warn");

    // If the first attempt fails, try with sudo chpasswd.
    changedPassword = await runCommandNoExpect(conn, commands.password.linux.step_2(string));
    if (typeof changedPassword !== "string") {
        log(`${host} Changed password`, "success");
        return true;
    }

    error = `${host} Unable to use sudo chpasswd. Got: ${changedPassword}. Please check for alias or no implementation.`;
    log(error, "warn");

    // Try with inputting the sudo password.
    changedPassword = await runCommandNotExpect(conn, commands.password.linux.step_3(sudoPassword, string), "sorry");
    if (typeof changedPassword !== "string") {
        log(`${host} Changed password`, "success");
        return true;
    }
    error = `${host} Unable to use sudo chpasswd. Got: ${changedPassword}. Please check for alias or no implementation.`;
    log(error, "error");

    return error;
}

export { changePasswordLinux };

/**
 *
 * @param {ssh2} conn
 * @returns
 */
async function checks(conn: SSH2Promise) {
    let passed = 7;
    const host = conn.config[0].host;
    log(`${host} running security checks`, "log");
    const checkedForShadow = await runCommand(
        conn,
        `if test -f ${shadow}; then
    echo "File exists.";
  fi`,
        "file exists"
    );
    if (typeof checkedForShadow === "string") {
        log(`${host} /etc/shadow check error GOT ${checkedForShadow} WANTED file exists, Please check for /etc/shadow`, "error");
        passed--;
    }

    const checkFilePermissions = async (path: string, expectedPermissions: string, logType: options) => {
        const result = await runCommand(conn, `ls -l ${path}`, expectedPermissions);
        if (typeof result === "string") {
            log(
                `${host} ${path} permissions check failed GOT ${result
                    .trim()
                    .substring(0, 11)} WANTED ${expectedPermissions}, Please check permissions`,
                logType
            );
            passed--;
        }
    };

    await checkFilePermissions("/etc/shadow", "-rw-------", "warn");
    await checkFilePermissions("/etc/passwd", "-rw-r--r--", "error");

    const checkCommand = async (command: string, expected: string, logType: options) => {
        const result = await runCommand(conn, command, expected);
        if (typeof result === "string") {
            log(`${host} ${command} check error GOT ${result} WANTED ${expected}, Please check for alias or no implementation`, logType);
            passed--;
        }
    };

    await checkCommand("type -t", "", "warn");
    await checkCommand("type -t type", "builtin", "error");
    await checkCommand("type -t chpasswd", "file", "error");
    await checkCommand("type -t passwd", "file", "error");

    log(`${host} Passed ${passed} of 7 tests`, "info");

    return;
}
