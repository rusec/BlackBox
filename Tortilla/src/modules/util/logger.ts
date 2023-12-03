import os from "os";
import path from "path";
import fs from "fs";

export type log_options = "warn" | "debug" | "info" | "error" | "log" | "success";

class Logger {
    process_dir: string;
    logFile: string;
    user: string;
    constructor() {
        this.process_dir = path.join(os.homedir() + "/Tortilla");
        this.logFile = path.join(this.process_dir, "tortilla.log");
        this.user = os.userInfo().username;
        if (!fs.existsSync(this.process_dir)) fs.mkdirSync(this.process_dir, { recursive: true });
        if (!fs.existsSync(this.logFile)) fs.writeFileSync(this.logFile, "");
    }
    log(message: string, type: log_options = "log") {
        fs.appendFileSync(this.logFile, this._format(message, type));
    }
    error(message: string) {
        fs.appendFileSync(this.logFile, this._format(message, "error"));
    }
    clear() {
        fs.writeFileSync(this.logFile, "");
    }
    ssh_log(message:string, type:log_options = 'log'){

        let now = new Date();
        let time = `[${now.toISOString()}]`;
        let user = os.userInfo().username;
        let t;
        switch (type.toLowerCase()) {
            default:
            case "log":
                t = "[LOG] ";
                break;
            case "debug":
                t = "[DEBUG] ";
                break;
            case "warn":
                t = "[WARNING] ";
                break;
            case "error":
                t = "[ERROR] ";
                break;
            case "info":
                t = "[MESSAGE] ";
                break;
            case "success":
                t = "[SUCCESS]";
                break;
        }

        fs.appendFileSync(this.logFile, `${time} [${user}] ${t} ${message}\n`);
    }
    _format(message: string, type: log_options) {
        let now = new Date();
        let time = `[${now.toISOString()}]`;
        let t;
        switch (type.toLowerCase()) {
            default:
            case "log":
                t = "[LOG] ";
                break;
            case "debug":
                t = "[DEBUG] ";
                break;
            case "warn":
                t = "[WARNING] ";
                break;
            case "error":
                t = "[ERROR] ";
                break;
            case "info":
                t = "[MESSAGE] ";
                break;
            case "success":
                t = "[SUCCESS]";
                break;
        }
        return `${time} [${this.user}] ${t} ${message}\n`;
    }
}

const logger = new Logger();

export default logger;
