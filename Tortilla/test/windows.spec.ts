import { assert } from "chai";
import "mocha";
import { ejectSSHkey, makeConnection, pingSSH, removeSSHkey } from "../src/modules/util/ssh_utils";
import runningDB, { ServerInfo } from "../src/modules/util/db";
import { changePasswordWin } from "../src/modules/password/change_password_windows";
import { target_win } from "./test_computers";

describe("SSH Windows", async function () {
    this.timeout(15000);
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
    it("should change password", async () => {
        let conn = await makeConnection(target_win);
        if (!conn) {
            assert(false, "Unable to connect to target");
        }
        let success = await changePasswordWin(target_win,conn, target_win.Username, "Password123");
        await conn.close();
        assert(success, `Unable to change password ${success}`);
    });
});
