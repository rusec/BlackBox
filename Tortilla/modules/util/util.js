


module.exports = {
    delay: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    ,
    removeANSIColorCodes: function (inputString) {
        const colorCodePattern = /\x1B\[[0-9;]*[A-Za-z]/g;

        const stringWithoutColor = inputString.replace(colorCodePattern, '');

        return stringWithoutColor;
    },
    isValidIPAddress: function (ip) {
        // Regular expression to match a valid IPv4 address
        const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

        // Check if the input string matches the IP pattern
        const match = ip.match(ipPattern);

        if (!match) {
            return false; // The input doesn't match the IP pattern
        }

        // Check each part of the IP address for validity
        for (let i = 1; i <= 4; i++) {
            const octet = parseInt(match[i], 10);
            if (octet < 0 || octet > 255) {
                return false; // Part of the IP address is out of range
            }
        }

        return true; // The input is a valid IPv4 address
    }
}