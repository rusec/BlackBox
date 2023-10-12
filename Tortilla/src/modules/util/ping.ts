const ssh2 = require("ssh2-promise");
const { detect_os } = require("../detect_os");

/**
 * Attempts to establish an SSH connection to a remote host for the purpose of detecting its operating system.
 *
 * @param {string} ip - The IP address of the remote host.
 * @param {string} username - The SSH username for authentication.
 * @param {string} password - The SSH password for authentication.
 * @returns {Promise<string | boolean>} A promise that resolves to the detected operating system (string) or `true` if the connection was successful but the OS detection failed. Returns `false` if the connection or OS detection failed.
 */

// export { pingSSH };
