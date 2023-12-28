import { changePasswordLinux } from "./change_password_linux";
import { changePasswordWin } from "./change_password_windows";
import { ServerInfo } from "../util/db";
import { changePasswordDarwin } from "./change_password_darwin";
import { changePasswordFreeBSD } from "./change_password_freeBSD";
import { log } from "../console/debug";
import options from "../util/options";
import { detect_os, makePermanentConnection } from "../util/ssh_utils";
import { ejectSSHkey, testPassword } from "../util/ssh_utils";
import { TestLDAPPassword } from "./active_directory";

export type password_result = {
    password: string;
    ssh: boolean;
    error: false | string;
};

async function changePasswordOf(computer: ServerInfo, new_password: string): Promise<password_result | string> {
    if (!new_password || new_password.length < 8) {
        return "Password does not meet requirements";
    }

    const conn = await makePermanentConnection(computer, true);

    try {
        let res;

        if (computer["OS Type"] === "windows") {
            const username = computer.Username;
            const newPassword = new_password;
        
            // Change password on Windows
            const passwordChangeResult = await changePasswordWin(computer, conn, username, newPassword);

            // Establish a permanent connection
            const newConn = await makePermanentConnection(computer, true);
        
            // Test LDAP password
            const ldapTestResult = await TestLDAPPassword(computer, newPassword);

            if (!newConn) {
                return {
                    password: ldapTestResult ? newPassword : computer.Password,
                    ssh: computer.ssh_key,
                    error: ldapTestResult ? false :`${computer["IP Address"]} ${computer.Name} Unable to connect to host` ,
                };
                throw new Error(`${computer["IP Address"]} ${computer.Name} Unable to connect to host`);
            }
        
            // Eject SSH key
            const sshKey = await ejectSSHkey(newConn, computer["OS Type"]);
        
            // Test new password
            const passwordTestResult = await testPassword(newConn, newPassword);
        
            return {
                password: passwordTestResult || ldapTestResult ? newPassword : computer.Password,
                ssh: !newConn ? computer.ssh_key : sshKey,
                error: passwordTestResult ? false : passwordChangeResult,
            };
        }
        if (!conn) {
            throw new Error(`${computer["IP Address"]} ${computer.Name} Unable to connect to host`);
        }

        if (!options.includes(computer["OS Type"])) {
            let os = await detect_os(conn);
            if (os) computer["OS Type"] = os;
        }

        switch (computer["OS Type"].toLowerCase()) {
            case "freebsd":
                res = await changePasswordFreeBSD(conn, computer.Username, new_password);
                break;
            case "linux":
                res = await changePasswordLinux(conn, computer.Username, new_password, computer.Password);
                break;
            case "darwin":
                res = await changePasswordDarwin(conn, computer.Username, computer.Password, new_password);
                break;
            default:
                res = "Unknown OS";
                break;
        }

        // ADD CHECK FOR SSH KEY
        let ssh_key = await ejectSSHkey(conn, computer["OS Type"]);

        let pass_success = await testPassword(conn, new_password);

        conn.removeAllListeners();

        return { password: pass_success ? new_password : computer.Password, ssh: ssh_key, error: pass_success ? false : res };
    } catch (error: any) {
        if (conn) {
            conn.error(`Got Error: ${error.message ? error.message : error}`);
        } else log(`[${computer["IP Address"]}] [${computer.Name}] Got Error: ${error.message ? error.message : error}`);
        return `Got Error: ${error.message ? error.message : error}`;
    }
}

export { changePasswordOf };
