"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIPAddress = exports.delay = exports.removeANSIColorCodes = void 0;
function removeANSIColorCodes(inputString) {
    const colorCodePattern = /\x1B\[[0-9;]*[A-Za-z]/g;
    const stringWithoutColor = inputString.replace(colorCodePattern, "");
    return stringWithoutColor;
}
exports.removeANSIColorCodes = removeANSIColorCodes;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
function isValidIPAddress(ip) {
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
exports.isValidIPAddress = isValidIPAddress;
//# sourceMappingURL=util.js.map