import { assert } from "chai";
import "mocha";
import { ejectSSHkey, makeConnection, pingSSH, removeSSHkey } from "../src/modules/util/ssh_utils";
import runningDB, { ServerInfo } from "../src/modules/util/db";

const target_linux: ServerInfo = {
    "IP Address": "192.168.64.3",
    Name: "Target",
    "OS Type": "linux",
    Password: "password",
    Username: "ubuntu",
};

describe("SSH Linux", async function () {
    this.timeout(5000);
    it("should be able to ping server", async () => {
        let type = await pingSSH(target_linux["IP Address"], target_linux.Username, target_linux.Password);
        assert(type);
    });
    it("should be able to eject SSH PUBLIC KEY", async () => {
        let conn = await makeConnection(target_linux);
        if (!conn) {
            assert(false, "Unable to connect to target");
        }
        let eject = await ejectSSHkey(conn, "linux");
        await conn.close();
        assert(eject);
    });
    it("should remove ssh key", async () => {
        let conn = await makeConnection(target_linux);
        if (!conn) {
            assert(false, "Unable to connect to target");
        }
        let eject = await removeSSHkey(conn, "linux");
        await conn.close();
        assert(eject);
    });
});
