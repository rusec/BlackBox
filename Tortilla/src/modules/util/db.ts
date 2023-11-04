import fs from "fs";
import crypto from "crypto";
import csv from "csvtojson";
import { log } from "./debug";
import bcrypt from "bcryptjs";
import inquirer from "inquirer";
import keccak256 from "keccak256";
import { machineIdSync } from "node-machine-id";
import keygen from "ssh-keygen-lite";
import { options } from "./options";
import { password_result } from "../password/change_passwords";
import logger from "./logger";
import path from "path";
import os from "os";
type DataBase = {
    master_password: string;
    ssh_private: string;
    ssh_public: string;
    computers: ServerInfo[];
};

const default_db: DataBase = {
    master_password: "",
    ssh_private: "",
    ssh_public: "",
    computers: [],
};

export type ServerInfo = {
    Name: string;
    "IP Address": string;
    Username: string;
    Password: string;
    "OS Type": options;
    ssh_key: boolean;
};
export type app_config = {
    master_hash: string;
};
class Encryption {
    constructor() {}
    async write(data: string, filePath: string, key: string) {
        try {
            const iv = crypto.randomBytes(16).toString("hex");
            const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
            let encryptedData = cipher.update(data, "utf8", "base64");
            encryptedData += cipher.final("base64");
            await fs.promises.writeFile(filePath, iv + encryptedData, "utf8");
            return true;
        } catch (error) {
            throw new Error(`Error writing and encrypting file: ${error}`);
        }
    }
    readSync(filePath: string, key: string) {
        try {
            let encryptedData = fs.readFileSync(filePath, "utf8");
            let iv = encryptedData.substring(0, 32);
            encryptedData = encryptedData.substring(32, encryptedData.length);
            const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
            let decryptedData = decipher.update(encryptedData, "base64", "utf8");
            decryptedData += decipher.final("utf8");
            return decryptedData;
        } catch (error) {
            return false;
        }
    }
    async read(filePath: string, key: string) {
        try {
            let encryptedData = await fs.promises.readFile(filePath, "utf8");
            let iv = encryptedData.substring(0, 32);
            encryptedData = encryptedData.substring(32, encryptedData.length);
            const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
            let decryptedData = decipher.update(encryptedData, "base64", "utf8");
            decryptedData += decipher.final("utf8");
            return decryptedData;
        } catch (error) {
            return false;
        }
    }
}

class DB {
    filePath: string;
    passwd: string;
    configs: app_config;
    ready: boolean;
    encrypt: Encryption;
    process_dir: string;
    constructor() {
        this.encrypt = new Encryption();
        this.process_dir = path.join(os.homedir() + "/Tortilla");

        this.filePath = path.join(this.process_dir, "muffins");

        // Adding password based encryption
        this.passwd = path.join(this.process_dir, "pineapples");
        try {
            let data = this.encrypt.readSync(this.passwd, this._getPKey(""));
            if (data === false) {
                throw new Error("Unable to parse passwd");
            }
            this.configs = JSON.parse(data);
            this.ready = true;
        } catch (error) {
            this.ready = false;
            this.configs = {
                master_hash: "",
            };
        }
    }
    _getPrivate() {}

    _getPKey(password_hash: string) {
        var uuid = this._getUUID();
        var plat = process.platform;
        let _encryptionKey = keccak256(uuid + plat + this._string() + password_hash + "shrimp_key").toString("hex");

        return _encryptionKey;
    }
    _getUUID() {
        return machineIdSync(true).toUpperCase();
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
        var uuid = this._getUUID() + process.platform;
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

    async getSSHPublicKey() {
        const db = await this._readJson(this.configs.master_hash);
        return db.ssh_public;
    }
    async getSSHPrivateKey() {
        const db = await this._readJson(this.configs.master_hash);
        return db.ssh_private;
    }

    /**
     * Reads data from a CSV file named 'computers.csv', processes it, and writes the normalized data to the running database.
     *
     * @returns {Promise<void>} A promise that resolves when the CSV data is successfully read, processed, and written to the running database.
     */
    async readCSV(): Promise<void> {
        try {
            let jsonArray = await csv().fromFile("./computers.csv");
            await this.writeComputers(normalizeServerInfo(jsonArray));
            logger.log("Read computers from CSV", "info");
        } catch (error) {}
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
    async addComputer(name: string, ip: string, username: string, password: string, os_type: options): Promise<boolean> {
        let computers = await this.readComputers();
        let index = computers.findIndex((v) => v["IP Address"] === ip);
        if (index != -1) {
            await this.removeComputer(index);
        }
        computers.push({
            Name: name || "",
            "IP Address": ip || "",
            Username: username || "",
            Password: password || "",
            "OS Type": os_type || "",
            ssh_key: false,
        });
        logger.log(`Added Computer ${name} ${ip}`, "info");

        return await this.writeComputers(computers);
    }
    /**
     * Removes a computer entry from the list of computers by its index.
     *
     * @param {number} index - The index of the computer entry to remove.
     * @returns {Promise<void>} A promise that resolves when the computer entry is successfully removed.
     */
    async removeComputer(index: number): Promise<boolean> {
        let computers = await this.readComputers();
        computers = computers.filter((_, i) => {
            return !(i === index);
        });
        logger.log(`Removed Computer ${index}`, "info");
        return await this.writeComputers(computers);
    }
    /**
     * Reads the master password hash and returns it from the current instance.
     *
     * @returns {Promise<string>} A promise that resolves to the master password.
     */
    readPassword(): string {
        const { master_hash } = this.configs;
        return master_hash;
    }
    /**
     * Updates the password of a computer in the list of computers by its index.
     *
     * @param {number} computer_id - The index of the computer to update.
     * @param {string} password - The new password to set for the computer.
     * @returns {Promise<void>} A promise that resolves when the computer password is successfully updated.
     * @throws {Error} Throws an error if the password is undefined.
     */
    async writeCompPassword(computer_id: number, password: string): Promise<boolean> {
        if (!password) {
            throw new Error("Password cannot be undefined");
        }
        try {
            const computers = await this.readComputers();
            computers[computer_id].Password = password;
            logger.log(`Changed Computer Password in Database`, "info");

            return await this.writeComputers(computers);
        } catch (error) {
            return false;
        }
    }
    async writeCompSSH(computer_id: number, result: boolean): Promise<boolean> {
        try {
            const computers = await this.readComputers();
            logger.log(`${result ? "Added" : "Removed"} SSH to Computer ${computers[computer_id]["IP Address"]}`, "info");
            computers[computer_id].ssh_key = result;
            return await this.writeComputers(computers);
        } catch (error) {
            return false;
        }
    }
    async writeCompResult(computer_id: number, result: password_result): Promise<boolean> {
        if (!result.password) {
            throw new Error("Password cannot be undefined");
        }
        try {
            const computers = await this.readComputers();
            computers[computer_id].Password = result.password;
            computers[computer_id].ssh_key = result.ssh;
            log(`Writing computer ${computers[computer_id]["IP Address"]}`, "info");
            logger.log(`Writing Computer ${computers[computer_id]["IP Address"]} in Database`, "info");

            return await this.writeComputers(computers);
        } catch (error) {
            return false;
        }
    }
    /**
     * Reads the list of computers from the running database.
     *
     * @returns {Promise<Array<ServerInfo>>} A promise that resolves to an array of computer objects.
     */

    async readComputers(): Promise<Array<ServerInfo>> {
        const { computers } = await this._readJson(this.configs.master_hash);
        return computers;
    }
    /**
     * Resets the master password in the database by prompting the user for the old and new passwords.
     *
     * @returns {Promise<void>} A promise that resolves when the master password is successfully reset.
     */
    async resetMasterPassword(): Promise<void> {
        const me = this;
        let trails = 3;
        const { master_password } = await inquirer.prompt([
            {
                name: "old",
                type: "password",
                validate: function (value) {
                    if (trails <= 0) {
                        process.exit(0);
                    }
                    trails--;
                    return me.validateMasterPassword(value) ? true : "Invalid Password";
                },
            },
            {
                name: "master_password",
                type: "input",
                validate: function (value) {
                    if (value.length > 8) {
                        return true;
                    }
                    return "Password must be longer then 8 characters";
                },
                message: "please enter a master password",
            },
        ]);
        await this.writePassword(master_password);
    }
    /**
     * Validates the Master Password for the program ensuring that the password hash is the same.
     * @param {string} master_password
     * @returns {boolean} returns true if password is correct
     */
    validateMasterPassword(master_password: string): boolean {
        if (typeof master_password != "string") {
            return false;
        }
        const hash = this.readPassword();
        if (hash === undefined) {
            return false;
        }
        if (hash === "") {
            return false;
        }
        return bcrypt.compareSync(master_password, hash);
    }

    /**
     * Writes an array of computer data to the database.
     *
     * @param {Array<Object>} jsonData - An array of computer data to be written to the database.
     * @returns {Promise<void>} A promise that resolves when the computer data is successfully written to the database.
     */
    async writeComputers(jsonData: Array<ServerInfo>): Promise<boolean> {
        const db = await this._readJson(this.configs.master_hash);
        db.computers = jsonData;
        return await this._writeJson(db, this.configs.master_hash);
    }

    /**
     * Hashes and stores a master password in the database.
     *
     * @param {string} password_string - The master password to hash and store.
     * @returns {Promise<void>} A promise that resolves when the password is hashed and stored in the database.
     */
    async writePassword(password_string: string): Promise<void> {
        logger.log(`Request to update Master Password`, "info");
        const hash = await this._bcryptPassword(password_string);
        if (!this.ready) {
            this.configs.master_hash = hash;
            this._writeJson(await this._resetDB(), this.configs.master_hash);
            this.ready = true;
            logger.log(`Database ready`, "info");
            logger.log(`Database init with password`, "info");
        }
        try {
            const db = await this._readJson(this.configs.master_hash);
            db.master_password = hash;
            this.configs.master_hash = hash;
            this.encrypt.write(JSON.stringify(this.configs), this.passwd, this._getPKey(""));
            await this._writeJson(db, this.configs.master_hash);
            logger.log(`Updated Database with new password`, "info");
        } catch (error) {
            logger.log(`Unable to Read Database while changing password`, "error");
            this.configs.master_hash = hash;
            this.encrypt.write(JSON.stringify(this.configs), this.passwd, this._getPKey(""));
            this._writeJson(await this._resetDB(), this.configs.master_hash);
            logger.log(`Reset Database with new password`, "error");
            logger.log(`Database ready`, "info");

            this.ready = true;
        }
    }
    /**
     * Writes the provided `jsonData` to the database file after normalizing and encrypting it.
     *
     * @param {DataBase} jsonData - The data to be written to the database file.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the write operation is successful.
     * @throws {Error} Throws an error if there is an issue with writing or encrypting the JSON data.
     */
    async _writeJson(jsonData: DataBase, password_hash: string): Promise<boolean> {
        try {
            const jsonStr = this._normalize(jsonData);
            return await this.encrypt.write(jsonStr, this.filePath, this._getPKey(password_hash));
        } catch (error) {
            throw new Error(`Error writing and encrypting JSON file: ${error}`);
        }
    }

    /**
     * Reads and decrypts the database file, returning the parsed data.
     *
     * @returns {Promise<DataBase>} A promise that resolves to a `DataBase` object containing the decrypted data.
     */
    async _readJson(password_hash: string): Promise<DataBase> {
        try {
            let decryptedData = await this.encrypt.read(this.filePath, this._getPKey(password_hash));
            if (decryptedData === false) {
                throw new Error("Returned false");
            }
            return JSON.parse(decryptedData);
        } catch (error) {
            log("UNABLE TO READ DB FILE RESETTING", "error");
            logger.log(`Resetting Database was unable to read DB using master password`, "error");
            await this._writeJson(await this._resetDB(), password_hash);
            return await this._readJson(password_hash);
        }
    }
    async _resetDB() {
        var keys = await genKey();
        let new_db = default_db;
        new_db.ssh_private = keys.key;
        new_db.ssh_public = keys.pubKey;
        return new_db;
    }
    _normalize(jsonData: DataBase) {
        if (typeof jsonData === "string") {
            return jsonData;
        }
        return JSON.stringify(jsonData);
    }
    async _bcryptPassword(password: string): Promise<string> {
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

const runningDB = new DB();

export default runningDB;

/**
 * Normalize an array of JSON objects into an array of ServerInfo objects.
 * @param {Array<Object>} jsonArr - An array of JSON objects to normalize.
 * @returns {Array<ServerInfo>} - An array of normalized ServerInfo objects.
 */
function normalizeServerInfo(jsonArr: Array<ServerInfo>): Array<ServerInfo> {
    const normalizedArr: ServerInfo[] = [];

    for (const jsonObj of jsonArr) {
        const serverInfo = {
            Name: jsonObj.Name || "",
            "IP Address": jsonObj["IP Address"] || "",
            Username: jsonObj.Username || "",
            Password: jsonObj.Password || "",
            "OS Type": jsonObj["OS Type"] || "",
            ssh_key: false,
        };

        normalizedArr.push(serverInfo);
    }

    return normalizedArr;
}

async function genKey(): Promise<{
    key: string;
    pubKey: string;
}> {
    return new Promise((resolve) => {
        keygen({
            comment: "a0d5125e9b004f08eb68990f",
            read: true,
            format: "PEM",
        })
            .then((value) => resolve(value))
            .catch(async (err) => await genKey());
    });
}
