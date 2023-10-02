const fs = require('fs')
const crypto = require('crypto')
const csv = require('csvtojson');
const { log } = require('./debug');
const bcrypt = require('bcrypt')
const inquirer = require('inquirer')
const keccak256 = require("keccak256");
const { machineIdSync } = require("node-machine-id");


/**
 * @typedef {Object} DataBase
 * @property {string} master_password
 * @property {Array<ServerInfo>} computers
 */


/**
 * @type {DataBase}
 */
const default_db = {
    master_password: '',
    computers: []
}
/**
 * Represents information about a remote server or device.
 * @typedef {Object} ServerInfo
 * @property {string} Name - The name or identifier of the server/device.
 * @property {string} "IP Address" - The IP address of the server/device.
 * @property {string} Username - The username used for authentication.
 * @property {string} Password - The password used for authentication.
 * @property {string} "OS Type" - The type or name of the operating system (OS) running on the server/device.
 */


class DB {

    constructor() {
        this.filePath = './muffins';

    }
    _getPKey() {
        var uuid = this._getUUID();
        var plat = process.platform
        let _encryptionKey = keccak256(
            uuid + plat + this._string() + "shrimp_key"
        ).toString("hex");

        return _encryptionKey;
    }
    _getUUID() {
        return machineIdSync({ original: true }).toUpperCase();
    }
    _string() {
        var _ = [
            "kadjv",
            "ketchup",
            "room",
            "atomsphere",
            "chair",
            "hat",
            "glasses",
            "napkin",
            "43",
            "load",
            "truck",
            "freemon",
            "soymilk",
            "light",
            "coke",
            "false",
            "kitchen",
            "laptop",
            "fork",
            "mask",
            "soda",
            "airplane",
            "song",
            "heads",
            "people",
            "usa",
            "town",
            "car",
            "sandwich",
        ];
        var uuid = (this._getUUID()) + process.platform;
        var result = "j";
        for (var i = 0; i < uuid.length; i++) {
            if (uuid[i] === "-" || uuid[i] === ":") {
                result += "k";
            } else {
                if (!isNaN(parseInt(uuid[i]))) {
                    result += _[parseInt(uuid[i])];
                } else {
                    var code = uuid[i].toUpperCase().charCodeAt(0);
                    if (code > 64 && code < 91) result += _[code - 64];
                }
            }
        }
        return result;
    }
    /**
     * Reads data from a CSV file named 'computers.csv', processes it, and writes the normalized data to the running database.
     *
     * @returns {Promise<void>} A promise that resolves when the CSV data is successfully read, processed, and written to the running database.
     */
    async readCSV() {
        try {
            let jsonArray = await csv().fromFile('./computers.csv')
            await this.writeComputers(normalizeServerInfo(jsonArray))
        } catch (error) {

        }
    }
    /**
     * Adds a computer entry to the list of computers, updating it if it already exists.
     *
     * @param {string} name - The name of the computer.
     * @param {string} ip - The IP address of the computer.
     * @param {string} username - The username for connecting to the computer.
     * @param {string} password - The password for connecting to the computer.
     * @param {string} os_type - The operating system type of the computer.
     * @returns {Promise<void>} A promise that resolves when the computer entry is successfully added or updated.
     */
    async addComputer(name, ip, username, password, os_type) {
        let computers = await this.readComputers();
        let index = computers.findIndex((v) => v['IP Address'] === ip)
        if (index != -1) {
            await this.removeComputer(index)
        }
        computers.push({
            Name: name || '',
            "IP Address": ip || '',
            Username: username || '',
            Password: password || '',
            "OS Type": os_type || ''
        })
        return await this.writeComputers(computers)
    }
    /**
 * Removes a computer entry from the list of computers by its index.
 *
 * @param {number} index - The index of the computer entry to remove.
 * @returns {Promise<void>} A promise that resolves when the computer entry is successfully removed.
 */
    async removeComputer(index) {
        let computers = await this.readComputers();
        computers = computers.filter((_, i) => {
            return !(i === index)
        })
        return await this.writeComputers(computers)
    }
    /**
     * Reads the master password from the running database or initializes it with a default value if not found.
     *
     * @returns {Promise<string>} A promise that resolves to the master password.
     */
    async readPassword() {
        const { master_password } = await this._readJson();
        if (master_password === undefined) {
            await this._writeJson(default_db)
            return await this.readPassword()
        }
        return master_password;
    }
    /**
 * Updates the password of a computer in the list of computers by its index.
 *
 * @param {number} computer_id - The index of the computer to update.
 * @param {string} password - The new password to set for the computer.
 * @returns {Promise<void>} A promise that resolves when the computer password is successfully updated.
 * @throws {Error} Throws an error if the password is undefined.
 */
    async writeCompPassword(computer_id, password) {
        if (!password) {
            throw new Error("Password cannot be undefined")
        }
        try {
            const computers = await this.readComputers();
            computers[computer_id].Password = password
            return await this.writeComputers(computers)
        } catch (error) {
            return error
        }

    }
    /**
     * Reads the list of computers from the running database.
     *
     * @returns {Promise<Array<ServerInfo>>} A promise that resolves to an array of computer objects.
     */

    async readComputers() {
        const { computers } = await this._readJson();
        return computers
    }
    /**
     * Resets the master password in the database by prompting the user for the old and new passwords.
     *
     * @returns {Promise<void>} A promise that resolves when the master password is successfully reset.
     */
    async resetMasterPassword() {
        const me = this
        const { master_password } = await inquirer.prompt([
            {
                name: 'old',
                type: 'password',
                validate: async function (value) {
                    return await me.validateMasterPassword(value)
                },
            },
            {
                name: 'master_password',
                type: 'input',
                validate: function (value) {
                    if (value.length > 8) {
                        return true;
                    }
                    return 'Password must be longer then 8 characters'
                },
                message: "please enter a master password"
            }
        ])
        await this.writePassword(master_password);
    }
    /**
     * Validates the Master Password for the program ensuring that the password hash is the same. 
     * @param {string} master_password 
     * @returns {Promise<boolean>} returns true if password is correct
     */
    async validateMasterPassword(master_password) {
        if (typeof master_password != 'string') {
            return false
        }
        const hash = await this.readPassword();
        if (hash === undefined) {
            return false;
        }
        if (hash === '') {
            return false;
        }
        return await bcrypt.compare(master_password, hash)
    }

    /**
     * Writes an array of computer data to the database.
     *
     * @param {Array<Object>} jsonData - An array of computer data to be written to the database.
     * @returns {Promise<void>} A promise that resolves when the computer data is successfully written to the database.
     */
    async writeComputers(jsonData) {
        const db = await this._readJson();
        db.computers = jsonData;
        return await this._writeJson(db)
    }

    /**
  * Hashes and stores a master password in the database.
  *
  * @param {string} password_string - The master password to hash and store.
  * @returns {Promise<void>} A promise that resolves when the password is hashed and stored in the database.
  */
    async writePassword(password_string) {
        const hash = await this._bcryptPassword(password_string);
        const db = await this._readJson();
        db.master_password = hash;
        await this._writeJson(db);
    }
    /**
 * Writes the provided `jsonData` to the database file after normalizing and encrypting it.
 *
 * @param {DataBase} jsonData - The data to be written to the database file.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the write operation is successful.
 * @throws {Error} Throws an error if there is an issue with writing or encrypting the JSON data.
 */
    async _writeJson(jsonData) {

        try {
            const jsonStr = this._normalize(jsonData);
            const iv = crypto.randomBytes(16).toString('hex')
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this._getPKey(), 'hex'), Buffer.from(iv, 'hex'));
            let encryptedData = cipher.update(jsonStr, 'utf8', 'base64');
            encryptedData += cipher.final('base64');
            await fs.promises.writeFile(this.filePath, iv + encryptedData, 'utf8');
            return true;
        } catch (error) {
            throw new Error(`Error writing and encrypting JSON file: ${error.message}`);
        }
    }

    /**
   * Reads and decrypts the database file, returning the parsed data.
   *
   * @returns {Promise<DataBase>} A promise that resolves to a `DataBase` object containing the decrypted data.
   */
    async _readJson() {
        try {
            let encryptedData = await fs.promises.readFile(this.filePath, 'utf8');
            let iv = encryptedData.substring(0, 32);
            encryptedData = encryptedData.substring(32, encryptedData.length)
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this._getPKey(), 'hex'), Buffer.from(iv, 'hex'));
            let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
            decryptedData += decipher.final('utf8');
            return JSON.parse(decryptedData);
        } catch (error) {
            log('UNABLE TO READ DB FILE RESETTING', 'error')
            await this._writeJson(default_db)
            return await this._readJson();
        }
    }
    _normalize(jsonData) {
        if (typeof jsonData === 'string') {
            return jsonData;
        }
        return JSON.stringify(jsonData)
    }
    async _bcryptPassword(password) {
        try {
            // Generate a salt (a random string)
            const saltRounds = 10; // You can adjust this according to your needs
            const salt = await bcrypt.genSalt(saltRounds);

            // Hash the password using the salt
            const hashedPassword = await bcrypt.hash(password, salt);

            return hashedPassword;
        } catch (error) {
            throw error;
        }
    }

}



const runningDB = new DB()

module.exports = runningDB



/**
 * Normalize an array of JSON objects into an array of ServerInfo objects.
 * @param {Array<Object>} jsonArr - An array of JSON objects to normalize.
 * @returns {Array<ServerInfo>} - An array of normalized ServerInfo objects.
 */
function normalizeServerInfo(jsonArr) {
    const normalizedArr = [];

    for (const jsonObj of jsonArr) {
        const serverInfo = {
            Name: jsonObj.Name || '',
            "IP Address": jsonObj["IP Address"] || '',
            Username: jsonObj.Username || '',
            Password: jsonObj.Password || '',
            "OS Type": jsonObj["OS Type"] || ''
        };

        normalizedArr.push(serverInfo);
    }

    return normalizedArr;
}