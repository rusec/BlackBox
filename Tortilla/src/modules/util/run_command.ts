import SSH2Promise from "ssh2-promise";

/**
 * Checks for not expected output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommandNotExpect(conn: SSH2Promise, command: string, not_expected: string): Promise<string | boolean> {
    try {
        const value = await conn.exec(command);
        if (value.trim().toLowerCase().includes(not_expected)) {
            return value.trim().replace("\n", " ");
        }
        return true;
    } catch (error: any) {
        if (error.trim().toLowerCase().includes(not_expected)) {
            return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
        }
        return true;
    }
}

/**
 * Checks for expected output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommand(conn: SSH2Promise, command: string, expect: string): Promise<string | boolean> {
    try {
        const value = await conn.exec(command);
        if (!value.trim().toLowerCase().includes(expect)) {
            return value.trim().replace("\n", " ");
        }
        return true;
    } catch (error: any) {
        if (error.toString().trim().toLowerCase().includes(expect)) {
            return true;
        }
        return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
    }
}

/**
 * checks for empty output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommandNoExpect(conn: SSH2Promise, command: string): Promise<string | boolean> {
    try {
        const value = await conn.exec(command);
        if (value.trim().toLowerCase() != "") {
            return value.trim().replace("\n", " ");
        }
        return true;
    } catch (error: any) {
        return typeof error === "string" ? error.trim().replace("\n", " ") : error.message.trim().replace("\n", " ");
    }
}

export { runCommand, runCommandNoExpect, runCommandNotExpect };
