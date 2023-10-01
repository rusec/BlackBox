const ssh2 = require('ssh2-promise')


/**
 * Checks for not expected output
 * @param {ssh2} conn 
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommandNotExpect(conn, command, not_expected) {
    try {
        const value = await conn.exec(command);
        if (value.trim().toLowerCase().includes(not_expected)) {
            return value.trim().replace('\n', ' ');
        }
        return true;

    } catch (error) {
        if (error.trim().toLowerCase().includes(not_expected)) {
            return typeof error === 'string' ? error.trim().replace('\n', ' ') : error.message.trim().replace('\n', ' ');
        }
        return true;
    }
}

/**
 * Checks for expected output
 * @param {ssh2} conn 
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommand(conn, command, expect) {
    try {
        const value = await conn.exec(command);
        if (!value.trim().toLowerCase().includes(expect)) {
            return value.trim().replace('\n', ' ');
        }
        return true;

    } catch (error) {
        if (error.toString().trim().toLowerCase().includes(expect)) {
            return true;
        }
        return typeof error === 'string' ? error.trim().replace('\n', ' ') : error.message.trim().replace('\n', ' ')
    }
}

/**
 * checks for empty output
 * @param {ssh2} conn 
 * @returns {Promise<String | Boolean>} returns true if successful or string error if not
 */
async function runCommandNoExpect(conn, command) {
    try {
        const value = await conn.exec(command);
        if (value.trim().toLowerCase() != '') {
            return value.trim().replace('\n', ' ');
        }
        return true
    } catch (error) {
        return typeof error === 'string' ? error.trim().replace('\n', ' ') : error.message.trim().replace('\n', ' ')
    }

}


module.exports = {
    runCommand,
    runCommandNoExpect,
    runCommandNotExpect
}