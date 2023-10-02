


module.exports = {
    /**
 * Delays the execution of code for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
    delay: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    ,
    /**
 * Removes ANSI color codes from a given input string.
 *
 * @param {string} inputString - The input string containing ANSI color codes.
 * @returns {string} The input string with ANSI color codes removed.
 */
    removeANSIColorCodes: function (inputString) {
        const colorCodePattern = /\x1B\[[0-9;]*[A-Za-z]/g;

        const stringWithoutColor = inputString.replace(colorCodePattern, '');

        return stringWithoutColor;
    },
    /**
 * Checks if a given string is a valid IPv4 address.
 *
 * @param {string} ip - The IP address to validate.
 * @returns {boolean} `true` if the IP address is valid, `false` otherwise.
 */
    isValidIPAddress: function (ip) {
        const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

        const match = ip.match(ipPattern);

        if (!match) {
            return false;
        }

        for (let i = 1; i <= 4; i++) {
            const octet = parseInt(match[i], 10);
            if (octet < 0 || octet > 255) {
                return false;
            }
        }

        return true;
    }
}