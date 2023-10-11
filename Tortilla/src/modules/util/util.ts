function removeANSIColorCodes(inputString: string): string {
    const colorCodePattern = /\x1B\[[0-9;]*[A-Za-z]/g;

    const stringWithoutColor = inputString.replace(colorCodePattern, "");

    return stringWithoutColor;
}
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isValidIPAddress(ip: string): boolean {
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
export { removeANSIColorCodes, delay, isValidIPAddress };
