import { assert } from "chai";
import "mocha";
import { ejectSSHkey, makeConnection, pingSSH, removeSSHkey } from "../src/modules/util/ssh_utils";
import runningDB, { ServerInfo } from "../src/modules/util/db";

const target_win: ServerInfo = {
    "IP Address": "192.168.1.165",
    Name: "Target",
    "OS Type": "windows",
    Password: "Password123",
    Username: "Administrator",
};

describe("SSH Windows", async function () {
    this.timeout(5000);
    it("should be able to ping server", async () => {
        let type = await pingSSH(target_win["IP Address"], target_win.Username, target_win.Password);
        assert(type, `expected windows got, ${type}`);
    });
    it("should be able to eject SSH PUBLIC KEY", async () => {
        let conn = await makeConnection(target_win);
        if (!conn) {
            assert(false, `Unable to connect to target, got ${conn}`);
        }
        let eject = await ejectSSHkey(conn, "windows");
        await conn.close();

        assert(eject, `Get ${eject}`);
    });
    it("should remove ssh key", async () => {
        let conn = await makeConnection(target_win);
        if (!conn) {
            assert(false, "Unable to connect to target");
        }
        let eject = await removeSSHkey(conn, "windows");
        await conn.close();
        assert(eject, `Get ${eject}`);
    });
});
