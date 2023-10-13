import SSH2Promise from "ssh2-promise";
import { replaceAll } from "./util";

/**
 * Checks for not expected output
 * @param {ssh2} conn
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommandNotExpect(conn: SSH2Promise, command: string, not_expected: string): Promise<string | boolean> {
    try {
        const value = await conn.exec(command);
        if (value.trim().toLowerCase().includes(not_expected)) {
            return replaceAll(value.trim(), "\n", " ");
        }
        return true;
    } catch (error: any) {
        if (error.trim().toLowerCase().includes(not_expected)) {
            return typeof error === "string" ? replaceAll(error, "\n", " ") : replaceAll(error.message, "\n", " ");
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
        if (!value.toLowerCase().includes(expect)) {
            return replaceAll(value.trim(), "\n", " ");
        }
        return true;
    } catch (error: any) {
        if (error.toString().trim().toLowerCase().includes(expect)) {
            return true;
        }
        return typeof error === "string" ? replaceAll(error, "\n", " ") : replaceAll(error.message, "\n", " ");
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
            return replaceAll(value.trim(), "\n", " ");
        }
        return true;
    } catch (error: any) {
        return typeof error === "string" ? replaceAll(error, "\n", " ") : replaceAll(error.message, "\n", " ");
    }
}
async function getOutput(conn: SSH2Promise, command: string): Promise<string> {
    try {
        const value = await conn.exec(command);
        return value;
    } catch (error: any) {
        return typeof error === "string" ? replaceAll(error, "\n", " ") : replaceAll(error.message, "\n", " ");
    }
}

export { runCommand, runCommandNoExpect, runCommandNotExpect, getOutput };
