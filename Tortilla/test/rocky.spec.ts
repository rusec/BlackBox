import { assert } from "chai";
import "mocha";
import { ejectSSHkey, makeConnection, pingSSH, removeSSHkey } from "../src/modules/util/ssh_utils";
import runningDB, { ServerInfo } from "../src/modules/util/db";
import { changePasswordLinux } from "../src/modules/change_password_linux";
import { changePasswordFreeBSD } from "../src/modules/change_password_freeBSD";
import { target_rocky } from "./test_computers";

describe("SSH Rocky", async function () {
    this.timeout(5000);
    it("should be able to ping server", async () => {
        let type = await pingSSH(target_rocky["IP Address"], target_rocky.Username, target_rocky.Password);
        assert(type);
    });
    it("should be able to eject SSH PUBLIC KEY", async () => {
        let conn = await makeConnection(target_rocky);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let eject = await ejectSSHkey(conn, "linux");
        await conn.close();
        assert(eject);
    });
    it("should remove ssh key", async () => {
        let conn = await makeConnection(target_rocky);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let eject = await removeSSHkey(conn, "linux");
        await conn.close();
        assert(eject);
    });
    it("should change password", async () => {
        let conn = await makeConnection(target_rocky);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let success = await changePasswordLinux(conn, target_rocky.Username, "password", target_rocky.Username);
        await conn.close();

        assert(success, `Unable to change password ${success}`);
    });
});
