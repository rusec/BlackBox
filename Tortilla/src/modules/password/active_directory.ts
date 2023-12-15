import ldap from "ldapjs-promise";
import util from "util";
import logger from "../util/logger";
import { ServerInfo } from "../util/db";
import { delay } from "../util/util";
import { log } from "../util/debug";

async function ChangeADPassword(ADIpAddress: string,hostname:string, domain: string, username: string, oldPassword: string, newPassword: string) {
    logger.log("Attempting to change Password using LDAP")
    const client = new LDAP(hostname, ADIpAddress,{
        url: `ldaps://${ADIpAddress}`, // Use ldaps for secure communication
        tlsOptions: {
            rejectUnauthorized: false,
        },
    });

    client.log("LDAP Connected")

    const bindDN = `CN=${username},CN=Users,` + domain_to_ldap(domain);
    client.log(`trying to bind to ${bindDN}`)

    await client.client.bind(bindDN, oldPassword);
    try {
        await client.client.modify(
            bindDN,
            new ldap.Change({
                operation: "delete",
                modification: {
                    type: "unicodePwd",
                    values: [encodePassword(oldPassword)],
                },
            })
        );
    } catch (error) {}

    await client.client.modify(
        bindDN,
        new ldap.Change({
            operation: "replace",
            modification: {
                type: "unicodePwd",
                values: [encodePassword(newPassword)],
            },
        })
    );
    client.log(`Changed Password of ${ADIpAddress} using LDAP`)

    await client.client.unbind();

}
async function LDAPChangePassword(server: ServerInfo, newPassword: string) {
    if (server.domain == "") {
        throw new Error("Unable to change Server without domain Set, please set domain");
    }
    await ChangeADPassword(server["IP Address"],server.Name, server.domain, stripDomain(server.Username), server.Password, newPassword);
}
async function TestLDAPPassword(server:ServerInfo, newPassword:string):Promise<boolean> {
    if (server.domain == "" || !server.domain) {
        return false;
    }
    await delay(3000)
    try {
        const bindDN = `CN=${stripDomain(server.Username)},CN=Users,` + domain_to_ldap(server.domain);

        const client = new LDAP(server.Name, server["IP Address"],{
            url: `ldaps://${server["IP Address"]}`, 
            // Use ldaps for secure communication
            tlsOptions: {
                rejectUnauthorized: false,
            },
        });
        client.log(`Attempting to test Password using LDAP ${bindDN}`)

        client.log("LDAP Connected")
        client.log("Attempting Password")
        try {
            await client.client.bind(bindDN, newPassword);
            client.log("Successful bind to LDAP")
            await client.client.unbind()
            return true;
        } catch (error) {
            client.log("unable to use password on LDAP")
            return false;
        }
        
    } catch (error) {
        console.log(error)
        logger.log("Unable to connect to LDAP")
        return false
    }
   


}
class LDAP {
    ipaddress: string;
    hostname: string;
    client: ldap.Client;
    constructor(hostname:string, ipaddress:string, options?: ldap.ClientOptions | undefined){
        this.ipaddress = ipaddress
        this.hostname = hostname
        this.client = ldap.createClient(options);
    }
    _getTag() {
        return `[${this.ipaddress}]`.bgGreen + ` ` + `[${this.hostname}]`.white + " ";
    }
    info(str: string) {
        log(this._getTag() + `${str}`, "info");
    }
    log(str: string) {
        log(this._getTag() + `${str}`, "log");
    }
    error(str: string) {
        log(this._getTag() + `${str}`, "error");
    }
    warn(str: string) {
        log(this._getTag() + `${str}`, "warn");
    }
    success(str: string) {
        log(this._getTag() + `${str}`, "success");
    }
    updateHostname(hostname: string) {
        this.hostname = hostname;
    }

}


// extracts the username from a domain
function stripDomain(fullUsername: string): string {
    // Use a regex pattern to match "domain\username"
    const regex = /(?:\\|@)([^\\@]+)$/;
    const match = fullUsername.match(regex);

    if (match && match[1]) {
        // If a match is found, return the captured group (username)
        return match[1];
    } else {
        // If no match is found, return the original string
        return fullUsername;
    }
}



function domain_to_ldap(domain: string): string {
    let domains_parts = domain.split(".");
    let mapping = domains_parts.map((v, k) => {
        if (k == domains_parts.length - 1) {
            return "DC=" + v;
        } else {
            return "DC=" + v + ",";
        }
    });
    return mapping.join("");
}
function encodePassword(str: string) {
    var output = "";
    str = '"' + str + '"';

    for (var i = 0; i < str.length; i++) {
        output += String.fromCharCode(str.charCodeAt(i) & 0xff, (str.charCodeAt(i) >>> 8) & 0xff);
    }

    return output;
}

export { LDAPChangePassword,TestLDAPPassword };
