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
        //Move to different file on system
        this.filePath = './muffins';

    }
    _getPKey() {
        if (this._encryptionKey) {
            return this._encryptionKey
        }
        var uuid = this._getUUID();
        var plat = process.platform
        this._encryptionKey = keccak256(
            uuid + plat + this._string()
        ).toString("hex");
        return this._encryptionKey;
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

    async readCSV() {
        try {
            let jsonArray = await csv().fromFile('./computers.csv')
            await this.writeComputers(normalizeServerInfo(jsonArray))
        } catch (error) {

        }
    }
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
    async removeComputer(index) {
        let computers = await this.readComputers();
        computers = computers.filter((_, i) => {
            return !(i === index)
        })
        return await this.writeComputers(computers)
    }

    async readPassword() {
        const { master_password } = await this._readJson();
        if (master_password === undefined) {
            await this._writeJson(default_db)
            return await this.readPassword()
        }
        return master_password;
    }
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

    async readComputers() {
        const { computers } = await this._readJson();
        return computers
    }

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
     * 
     * @param {Array<ServerInfo>} jsonData 
     */
    async writeComputers(jsonData) {
        const db = await this._readJson();
        db.computers = jsonData;
        return await this._writeJson(db)
    }

    /**
    * 
    * @param {String} password_string 
    */
    async writePassword(password_string) {
        const hash = await this._bcryptPassword(password_string);
        const db = await this._readJson();
        db.master_password = hash;
        await this._writeJson(db);
    }
    /**
     * 
     * @param {DataBase} jsonData 
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
  * 
  * @returns {Promise<DataBase>}
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