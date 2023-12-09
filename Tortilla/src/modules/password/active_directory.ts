import ldap from "ldapjs-promise";
import util from "util";
import logger from "../util/logger";
import { ServerInfo } from "../util/db";

async function ChangeADPassword(ADIpAddress: string, domain: string, username: string, oldPassword: string, newPassword: string) {
    logger.log("Attempting to change Password using LDAP")
    const client = ldap.createClient({
        url: `ldaps://${ADIpAddress}`, // Use ldaps for secure communication
        tlsOptions: {
            rejectUnauthorized: false,
        },
    });

    logger.log("LDAP Connected")

    const bindDN = `CN=${username},CN=Users,` + domain_to_ldap(domain);
    await client.bind(bindDN, oldPassword);
    try {
        await client.modify(
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

    await client.modify(
        bindDN,
        new ldap.Change({
            operation: "replace",
            modification: {
                type: "unicodePwd",
                values: [encodePassword(newPassword)],
            },
        })
    );
    logger.log(`Changed Password of ${ADIpAddress} using LDAP`)

    await client.unbind();
}
async function LDAPChangePassword(server: ServerInfo, newPassword: string) {
    if (server.domain == "") {
        throw new Error("Unable to change Server without domain Set, please set domain");
    }
    await ChangeADPassword(server["IP Address"], server.domain, stripDomain(server.Username), server.Password, newPassword);
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

export { LDAPChangePassword };
