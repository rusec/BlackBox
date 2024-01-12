import { Level } from "level";
import crypto from "crypto";
import path from "path";
import os from "os";
import { AbstractSublevel } from "abstract-level";
import { machineIdSync } from "node-machine-id";
import keccak256 from "keccak256";
import keygen from "ssh-keygen-lite";
import csv from "csvtojson";
import { ServerInfo } from "./dbtypes";
import logger from "../modules/console/logger";
import { options } from "../modules/util/options";
import bcrypt from "bcryptjs";
import { password_result } from "../modules/password/change_passwords";
import { log } from "../modules/console/debug";
import inquirer from "inquirer";
import { delay } from "../modules/util/util";
let UUID = "";
class Encryption {
    constructor() {}
    encrypt(data: string, key: string) {
        try {
            const iv = crypto.randomBytes(16).toString("hex");
            const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
            let encryptedData = cipher.update(data, "utf8", "base64");
            encryptedData += cipher.final("base64");
            return iv + encryptedData;
        } catch (error) {
            throw new Error(`Error writing and encrypting file: ${error}`);
        }
    }
    decrypt(data: string, key: string) {
        try {
            if (!data) {
                throw new Error("Data cannot be undefined");
            }
            let encryptedData = data;
            let iv = encryptedData.substring(0, 32);
            encryptedData = encryptedData.substring(32);
            const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
            let decryptedData = decipher.update(encryptedData, "base64", "utf8");
            decryptedData += decipher.final("utf8");
            return decryptedData;
        } catch (error) {
            return false;
        }
    }
}
async function genKey(): Promise<{
    key: string;
    pubKey: string;
}> {
    return new Promise((resolve) => {
        keygen({
            comment: "My_Lonely_Script",
            read: true,
            format: "PEM",
        })
            .then((value) => resolve(value))
            .catch(async (err) => await genKey());
    });
}
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
            password_changes: 0,
            domain: jsonObj["domain"] || "",
        };

        normalizedArr.push(serverInfo);
    }

    return normalizedArr;
}
async function bcryptPassword(password: string): Promise<string> {
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

class DataBase {
    process_dir: string;
    filePath: string;
    db: Level<string, any>;
    configs: AbstractSublevel<Level<string, any>, string | Buffer | Uint8Array, string, string>;
    computers: AbstractSublevel<Level<string, ServerInfo>, string | Buffer | Uint8Array, string, ServerInfo>;
    encrypt: Encryption;
    ready: boolean;
    masterHash: string;

    constructor() {
        this.encrypt = new Encryption();
        this.process_dir = path.join(os.homedir() + "/Tortilla");
        this.filePath = path.join(this.process_dir, "testingDB");
        this.db = new Level(this.filePath);
        this.configs = this.db.sublevel("app_configs");
        this.computers = this.db.sublevel("computers", { valueEncoding: "json" });
        this.masterHash = '';
        this.ready = false;
        this.initDB();
    }
    async initDB() {
        try {
            await this.db.open()
            
            this.configs = this.db.sublevel("app_configs");
            this.computers = this.db.sublevel("computers", { valueEncoding: "json" });
            //check for configs
            let encryptedSSHPkey = await this.configs.get("privateKey");
            let sshPkey = this.encrypt.decrypt(encryptedSSHPkey, this._getPKey(""));
            if (!sshPkey) {
                throw new Error("unable to parse ssh private key resetting db");
            }
            this.ready = true;
        } catch (error) {
            logger.log(error as string)
            await this._resetDB();
        }
    }

    private async _resetDB() {
        try {
            let encryptKey = this._getPKey("");
            await this.deleteComputers();
            var keys = await genKey();
            await this.configs.put("privateKey", this.encrypt.encrypt(keys.key, encryptKey));
            await this.configs.put("publicKey", this.encrypt.encrypt(keys.pubKey, encryptKey));
            this.ready = true;
        } catch (error) {
            await this._resetDB()
        }
        
    }
    async deleteComputers() {
        await this.computers.clear();
    }
    async readCSV(): Promise<void> {
        let encryptionKey = this._getPKey("");
        try {
            let passwd_hash = this.encrypt.decrypt(await this.configs.get("master_hash").catch(()=> ''), encryptionKey);
            if (!passwd_hash) {
                throw new Error("no master password");
            }
            await this.deleteComputers();
            let jsonArray = await csv().fromFile("./computers.csv");
            let computers = normalizeServerInfo(jsonArray);
            for (const target of computers) {
                target.Password =this.encrypt.encrypt(target.Password || "", this._getPKey(passwd_hash))
                this.computers.put(target["IP Address"], target);
            }
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
     * @returns {Promise<boolean>} A promise that resolves when the computer entry is successfully added or updated.
     */
    async addComputer(name: string, ip: string, username: string, password: string, os_type: options, domain: string = ""): Promise<boolean> {
        let encryptionKey = this._getPKey("");
        try {
            let passwd_hash = this.encrypt.decrypt(await this.configs.get("master_hash").catch(()=> ''), encryptionKey);
            if (!passwd_hash) {
                throw new Error("no master password");
            }
            // let computers = await this.readComputers();
            let computer = await this.computers.get(ip).catch(()=> undefined);
            if (!computer) {
                await this.computers.put(ip, {
                    Name: name || "",
                    "IP Address": ip || "",
                    Username: username || "",
                    Password: this.encrypt.encrypt(password || "", this._getPKey(passwd_hash)),
                    "OS Type": os_type || "",
                    ssh_key: false,
                    password_changes: 0,
                    domain: domain || "",
                });
            } else {
                await this.computers.put(ip, {
                    Name: name || computer.Name,
                    "IP Address": ip || computer["IP Address"],
                    Username: username || computer.Username,
                    Password: this.encrypt.encrypt(password, this._getPKey(passwd_hash)) || computer.Password,
                    "OS Type": os_type || computer["OS Type"],
                    ssh_key: false || computer["ssh_key"], // You can decide how to update this property
                    password_changes: computer["password_changes"] || 0,
                    domain: domain || computer["domain"],
                });
            }

            logger.log(`Added Computer ${name} ${ip}`, "info");
            return true;
        } catch (error) {
            return false;
        }
    }
    async updateComputers(old_key: string, new_key: string) {
        for await (const ip of this.computers.keys()) {
            let computer = await this.computers.get(ip);
            let old_pass = this.encrypt.decrypt(computer.Password, old_key);
            if (!old_pass) {
                logger.error(`Unable to read Password of ${computer["IP Address"]} [${computer.Name}]`);
            } else computer.Password = this.encrypt.encrypt(old_pass, new_key);
            await this.computers.put(ip, computer)
        }
    }

    async writePassword(password_string: string): Promise<void> {
        logger.log(`Request to update Master Password`, "info");
        let encryptionKey = this._getPKey("");
        const hash = await bcryptPassword(password_string);
        const old_hash_encrypted = await this.configs.get("master_hash").catch(()=> '');
        //has old hash
        const old_hash = this.encrypt.decrypt(old_hash_encrypted, encryptionKey);

        // unable to read old_hash means either corruption or no password and db is just init
        if (!old_hash) {
            await this.configs.put("master_hash", this.encrypt.encrypt(hash, encryptionKey));
            await this._resetDB();
            logger.log(`Reset Database with new password`, "error");
            logger.log(`Database ready`, "info");
            this.ready = true;
            return;
        }
        await this.configs.put("master_hash", this.encrypt.encrypt(hash, encryptionKey));
        await this.updateComputers(this._getPKey(old_hash), this._getPKey(hash));
        logger.log(`Updated Database with new password`, "info");
        return;

    
    }
    async editComputer(ip:string, username?:string, domain?:string, os?:options){
        try {
            let computer = await this.computers.get(ip);
            if(username){
                computer.Username = username;
            }
            if(domain){
                computer.domain = domain
            }
            if(os){
                computer["OS Type"] = os
            }
            await this.computers.put(ip, computer)
        }catch(err){
            return false;
        }
    }
    async getPasswordChanges() {
        let computers = this.computers.keys();
        let result = 0;
        for await (let ip of computers) {
            let computer = await this.computers.get(ip);
            result += computer.password_changes;
        }
        return result;
    }

    /**
     * Removes a computer entry from the list of computers by its index.
     *
     * @param {string} ip - The index of the computer entry to remove.
     * @returns {Promise<void>} A promise that resolves when the computer entry is successfully removed.
     */
    async removeComputer(ip: string): Promise<boolean> {
        await this._backUp();
        await this.computers.del(ip).catch(()=> "");
        logger.log(`Removed Computer ${ip}`, "info");
        return true;
    }

    /**
     * Reads the master password hash and returns it from the current instance.
     *
     * @returns {Promise<string | false>} A promise that resolves to the master password.
     */
    async readPassword() {
        try {
            return this.encrypt.decrypt(await this.configs.get("master_hash").catch(()=> ''), this._getPKey(""));
        } catch (error) {
            return false;
        }
        
    }
    private async getDbEncryptionKey() {
        let encryptionKey = this._getPKey("");
        let passwd_hash_encrypted = await this.configs.get("master_hash").catch(()=> '');
        if(passwd_hash_encrypted == ''){
            return false
        }
        let hash = this.encrypt.decrypt(passwd_hash_encrypted, encryptionKey);
        if (!hash) {
            return false;
        }
        return this._getPKey(hash);
    }
    /**
     * Updates the password of a computer in the list of computers by its index.
     *
     * @param {string} ip - The index of the computer to update.
     * @param {string} password - The new password to set for the computer.
     * @returns {Promise<void>} A promise that resolves when the computer password is successfully updated.
     * @throws {Error} Throws an error if the password is undefined.
     */
    async writeCompPassword(ip: string, password: string): Promise<boolean> {
        if (!password) {
            throw new Error("Password cannot be undefined");
        }
        try {
            let encryptKey = await this.getDbEncryptionKey();
            if (!encryptKey) {
                return false;
            }
            let computer = await this.computers.get(ip).catch(()=> undefined);
            if (!computer) {
                return false;
            }
            computer.Password = this.encrypt.encrypt(password, encryptKey);
            await this.computers.put(ip, computer);
            return true;
        } catch (error: any) {
            logger.log(error.toString())
            return false;
        }
    }

    async writeCompSSH(ip: string, result: boolean): Promise<boolean> {
        try {
            let computer = await this.computers.get(ip).catch(()=> undefined);
            if (!computer) {
                return false;
            }

            logger.log(`${result ? "Added" : "Removed"} SSH to Computer ${computer["IP Address"]}`, "info");
            computer.ssh_key = result;
            this.computers.put(ip, computer);
            return true;
        } catch (error) {
            return false;
        }
    }

    async writeCompResult(ip: string, result: password_result): Promise<boolean> {
        if (!result.password) {
            throw new Error("Password cannot be undefined");
        }
        let encryptKey = await this.getDbEncryptionKey();
        if (!encryptKey) {
            return false;
        }

        try {
            let computer = await this.computers.get(ip).catch(()=> undefined);
            if (!computer) {
                return false;
            }

            computer.Password = this.encrypt.encrypt(result.password, encryptKey);
            computer.ssh_key = result.ssh;
            computer.password_changes = computer.password_changes + 1;
            // const computers = await this.readComputers();

            log(`Writing computer ${computer["IP Address"]} ${computer["Name"]}`, "info");
            logger.log(`Writing Computer ${computer["IP Address"]} ${computer["Name"]} in Database`, "info");
            await this.computers.put(ip, computer);
            return true;
        } catch (error) {
            return false;
        }
    }
    async getComputer(ip:string){
        try {
            return await this.computers.get(ip)
        } catch (error) {
            return false;
        }
    }
    async readComputers(): Promise<Array<ServerInfo>> {
        let computers: Array<ServerInfo> = [];
        let encryptionKey = await this.getDbEncryptionKey();
        if (!encryptionKey) {
            return computers;
        }
        for await (let ip of this.computers.keys()) {
            let computer = await this.computers.get(ip);
            let pass = this.encrypt.decrypt(computer.Password, encryptionKey);
            if (pass) {
                computer.Password = pass;
            }
            computers.push(computer);
        }

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
        let new_password = "";
        let trails_password = 3;
        let password_hash:string |false = await this.readPassword();
        

        //FIX THIS, Currently any hash can be sent to validate. 
        const { master_password } = await inquirer.prompt([
            {
                name: "old",
                type: "password",
                validate: function (value) {
                    if (trails <= 0) {
                        process.exit(0);
                    }
                    trails--;
                    return me.validateMasterPassword(password_hash,value) ? true : "Invalid Password";
                },
            },
            {
                name: "master_password",
                type: "password",
                validate: function (value) {
                    if (value.length > 8) {
                        new_password = value;
                        return true;
                    }
                    return "Password must be longer then 8 characters";
                },
                message: "please enter a master password",
            },
            {
                name: "confirm",
                type: "password",
                validate: function (value) {
                    if (trails_password <= 0) {
                        process.exit(0);
                    }
                    if (value == new_password) {
                        return true;
                    }
                    trails_password--;
                    return "Password must match";
                },
                message: "please confirm new password",
            },
        ]);

        await this.writePassword(master_password);
    }




    /**
     * Validates the Master Password for the program ensuring that the password hash is the same.
     * @param {string | boolean} hash
     * @param {string} master_password
     * @returns {boolean} returns true if password is correct
     */
    validateMasterPassword(hash:string |false, master_password: string): boolean {
        if (typeof master_password != "string") {
            return false;
        }
        if (hash === undefined) {
            return false;
        }
        if (hash === "") {
            return false;
        }
        if(!hash){
            return false;
        }
        return bcrypt.compareSync(master_password, hash);
    }
    private async _backUp() {}

    private _getPKey(password_hash: string) {
        var uuid = this._getUUID();
        var plat = process.platform;
        let _encryptionKey = keccak256(uuid + plat + this._string() + password_hash + "shrimp_key").toString("hex");

        return _encryptionKey;
    }
    private _getUUID() {
        if (UUID == "") {
            UUID = machineIdSync(true).toUpperCase();
        }
        return UUID;
    }
    private _string() {
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
    async getPrivateSSHKey() {
        const encrypted_ssh = await this.configs.get("privateKey").catch(()=> '');
        let key = this.encrypt.decrypt(encrypted_ssh, this._getPKey(""))
        return key ? key : '';
    }
    async getPublicSSHKey() {
        const encrypted_ssh = await this.configs.get("publicKey").catch(()=> '');
        let key = this.encrypt.decrypt(encrypted_ssh, this._getPKey(""))
        return key ? key : '';
    }
}


const runningDB = new DataBase();

export default runningDB;