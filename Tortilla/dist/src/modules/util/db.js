"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const csvtojson_1 = __importDefault(require("csvtojson"));
const debug_1 = require("./debug");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const inquirer_1 = __importDefault(require("inquirer"));
const keccak256_1 = __importDefault(require("keccak256"));
const node_machine_id_1 = require("node-machine-id");
const ssh_keygen_lite_1 = __importDefault(require("ssh-keygen-lite"));
const default_db = {
    master_password: "",
    ssh_private: "",
    ssh_public: "",
    computers: [],
};
class DB {
    constructor() {
        this.filePath = "./muffins";
    }
    _getPrivate() { }
    _getPKey() {
        var uuid = this._getUUID();
        var plat = process.platform;
        let _encryptionKey = (0, keccak256_1.default)(uuid + plat + this._string() + "shrimp_key").toString("hex");
        return _encryptionKey;
    }
    _getUUID() {
        return (0, node_machine_id_1.machineIdSync)(true).toUpperCase();
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
            }
            else {
                if (!isNaN(parseInt(uuid[i]))) {
                    result += _[parseInt(uuid[i])];
                }
                else {
                    var code = uuid[i].toUpperCase().charCodeAt(0);
                    if (code > 64 && code < 91)
                        result += _[code - 64];
                }
            }
        }
        return result;
    }
    getSSHPublicKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this._readJson();
            return db.ssh_private;
        });
    }
    getSSHPrivateKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this._readJson();
            return db.ssh_public;
        });
    }
    /**
     * Reads data from a CSV file named 'computers.csv', processes it, and writes the normalized data to the running database.
     *
     * @returns {Promise<void>} A promise that resolves when the CSV data is successfully read, processed, and written to the running database.
     */
    readCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let jsonArray = yield (0, csvtojson_1.default)().fromFile("./computers.csv");
                yield this.writeComputers(normalizeServerInfo(jsonArray));
            }
            catch (error) { }
        });
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
    addComputer(name, ip, username, password, os_type) {
        return __awaiter(this, void 0, void 0, function* () {
            let computers = yield this.readComputers();
            let index = computers.findIndex((v) => v["IP Address"] === ip);
            if (index != -1) {
                yield this.removeComputer(index);
            }
            computers.push({
                Name: name || "",
                "IP Address": ip || "",
                Username: username || "",
                Password: password || "",
                "OS Type": os_type || "",
            });
            return yield this.writeComputers(computers);
        });
    }
    /**
     * Removes a computer entry from the list of computers by its index.
     *
     * @param {number} index - The index of the computer entry to remove.
     * @returns {Promise<void>} A promise that resolves when the computer entry is successfully removed.
     */
    removeComputer(index) {
        return __awaiter(this, void 0, void 0, function* () {
            let computers = yield this.readComputers();
            computers = computers.filter((_, i) => {
                return !(i === index);
            });
            return yield this.writeComputers(computers);
        });
    }
    /**
     * Reads the master password from the running database or initializes it with a default value if not found.
     *
     * @returns {Promise<string>} A promise that resolves to the master password.
     */
    readPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            const { master_password } = yield this._readJson();
            if (master_password === undefined) {
                yield this._writeJson(default_db);
                return yield this.readPassword();
            }
            return master_password;
        });
    }
    /**
     * Updates the password of a computer in the list of computers by its index.
     *
     * @param {number} computer_id - The index of the computer to update.
     * @param {string} password - The new password to set for the computer.
     * @returns {Promise<void>} A promise that resolves when the computer password is successfully updated.
     * @throws {Error} Throws an error if the password is undefined.
     */
    writeCompPassword(computer_id, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!password) {
                throw new Error("Password cannot be undefined");
            }
            try {
                const computers = yield this.readComputers();
                computers[computer_id].Password = password;
                return yield this.writeComputers(computers);
            }
            catch (error) {
                return false;
            }
        });
    }
    /**
     * Reads the list of computers from the running database.
     *
     * @returns {Promise<Array<ServerInfo>>} A promise that resolves to an array of computer objects.
     */
    readComputers() {
        return __awaiter(this, void 0, void 0, function* () {
            const { computers } = yield this._readJson();
            return computers;
        });
    }
    /**
     * Resets the master password in the database by prompting the user for the old and new passwords.
     *
     * @returns {Promise<void>} A promise that resolves when the master password is successfully reset.
     */
    resetMasterPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            const me = this;
            const { master_password } = yield inquirer_1.default.prompt([
                {
                    name: "old",
                    type: "password",
                    validate: function (value) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return yield me.validateMasterPassword(value);
                        });
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
            yield this.writePassword(master_password);
        });
    }
    /**
     * Validates the Master Password for the program ensuring that the password hash is the same.
     * @param {string} master_password
     * @returns {Promise<boolean>} returns true if password is correct
     */
    validateMasterPassword(master_password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof master_password != "string") {
                return false;
            }
            const hash = yield this.readPassword();
            if (hash === undefined) {
                return false;
            }
            if (hash === "") {
                return false;
            }
            return yield bcryptjs_1.default.compare(master_password, hash);
        });
    }
    /**
     * Writes an array of computer data to the database.
     *
     * @param {Array<Object>} jsonData - An array of computer data to be written to the database.
     * @returns {Promise<void>} A promise that resolves when the computer data is successfully written to the database.
     */
    writeComputers(jsonData) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this._readJson();
            db.computers = jsonData;
            return yield this._writeJson(db);
        });
    }
    /**
     * Hashes and stores a master password in the database.
     *
     * @param {string} password_string - The master password to hash and store.
     * @returns {Promise<void>} A promise that resolves when the password is hashed and stored in the database.
     */
    writePassword(password_string) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = yield this._bcryptPassword(password_string);
            const db = yield this._readJson();
            db.master_password = hash;
            yield this._writeJson(db);
        });
    }
    /**
     * Writes the provided `jsonData` to the database file after normalizing and encrypting it.
     *
     * @param {DataBase} jsonData - The data to be written to the database file.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the write operation is successful.
     * @throws {Error} Throws an error if there is an issue with writing or encrypting the JSON data.
     */
    _writeJson(jsonData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonStr = this._normalize(jsonData);
                const iv = crypto_1.default.randomBytes(16).toString("hex");
                const cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(this._getPKey(), "hex"), Buffer.from(iv, "hex"));
                let encryptedData = cipher.update(jsonStr, "utf8", "base64");
                encryptedData += cipher.final("base64");
                yield fs_1.default.promises.writeFile(this.filePath, iv + encryptedData, "utf8");
                return true;
            }
            catch (error) {
                throw new Error(`Error writing and encrypting JSON file: ${error}`);
            }
        });
    }
    /**
     * Reads and decrypts the database file, returning the parsed data.
     *
     * @returns {Promise<DataBase>} A promise that resolves to a `DataBase` object containing the decrypted data.
     */
    _readJson() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let encryptedData = yield fs_1.default.promises.readFile(this.filePath, "utf8");
                let iv = encryptedData.substring(0, 32);
                encryptedData = encryptedData.substring(32, encryptedData.length);
                const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(this._getPKey(), "hex"), Buffer.from(iv, "hex"));
                let decryptedData = decipher.update(encryptedData, "base64", "utf8");
                decryptedData += decipher.final("utf8");
                return JSON.parse(decryptedData);
            }
            catch (error) {
                (0, debug_1.log)("UNABLE TO READ DB FILE RESETTING", "error");
                yield this._writeJson(yield this._resetDB());
                return yield this._readJson();
            }
        });
    }
    _resetDB() {
        return __awaiter(this, void 0, void 0, function* () {
            var keys = yield genKey();
            let new_db = default_db;
            new_db.ssh_private = keys.key;
            new_db.ssh_public = keys.pubKey;
            return new_db;
        });
    }
    _normalize(jsonData) {
        if (typeof jsonData === "string") {
            return jsonData;
        }
        return JSON.stringify(jsonData);
    }
    _bcryptPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate a salt (a random string)
                const saltRounds = 10; // You can adjust this according to your needs
                const salt = yield bcryptjs_1.default.genSalt(saltRounds);
                // Hash the password using the salt
                const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
                return hashedPassword;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
const runningDB = new DB();
exports.default = runningDB;
/**
 * Normalize an array of JSON objects into an array of ServerInfo objects.
 * @param {Array<Object>} jsonArr - An array of JSON objects to normalize.
 * @returns {Array<ServerInfo>} - An array of normalized ServerInfo objects.
 */
function normalizeServerInfo(jsonArr) {
    const normalizedArr = [];
    for (const jsonObj of jsonArr) {
        const serverInfo = {
            Name: jsonObj.Name || "",
            "IP Address": jsonObj["IP Address"] || "",
            Username: jsonObj.Username || "",
            Password: jsonObj.Password || "",
            "OS Type": jsonObj["OS Type"] || "",
        };
        normalizedArr.push(serverInfo);
    }
    return normalizedArr;
}
function genKey() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            (0, ssh_keygen_lite_1.default)({
                read: true,
                format: "PEM",
            })
                .then((value) => resolve(value))
                .catch((err) => __awaiter(this, void 0, void 0, function* () { return yield genKey(); }));
        });
    });
}
//# sourceMappingURL=db.js.map