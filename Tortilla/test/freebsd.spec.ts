import { assert } from "chai";
import "mocha";
import { ejectSSHkey, makeConnection, pingSSH, removeSSHkey } from "../src/modules/util/ssh_utils";
import  { ServerInfo } from "../src/db/dbtypes";
import { changePasswordLinux } from "../src/modules/password/change_password_linux";
import { changePasswordFreeBSD } from "../src/modules/password/change_password_freeBSD";
import { target_freebsd } from "./test_computers";

describe("SSH FreeBSD", async function () {
    this.timeout(5000);
    it("should be able to ping server", async () => {
        let type = await pingSSH(target_freebsd["IP Address"], target_freebsd.Username, target_freebsd.Password);
        assert(type);
    });
    it("should be able to eject SSH PUBLIC KEY", async () => {
        let conn = await makeConnection(target_freebsd);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let eject = await ejectSSHkey(conn, "freebsd");
        await conn.close();
        assert(eject);
    });
    it("should remove ssh key", async () => {
        let conn = await makeConnection(target_freebsd);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let eject = await removeSSHkey(conn, "freebsd");
        await conn.close();
        assert(eject);
    });
    it("should change password", async () => {
        let conn = await makeConnection(target_freebsd);
        if (!conn) {
            assert.fail("Unable to connect to target");
        }
        let success = await changePasswordFreeBSD(conn, target_freebsd.Username, "password");

        assert(success, `Unable to change password ${success}`);
    });
});
