import { scanComputer } from "../../modules/computer/scan";
import { pressEnter } from "../../modules/console/enddingModules";
import { checkPassword } from "../../modules/util/checkPassword";
import runningDB from "../../modules/util/db";
import { log } from "../../modules/util/debug";
import { makeConnection } from "../../modules/util/ssh_utils";
import { Home } from "../menu/home";


async function scanComputers(){
    await checkPassword();
    const servers = await runningDB.readComputers();

    log("Scanning Systems")
    let success = 0;
    let done = 1;
    let numberOfComputers = servers.length
    for(let server of servers){
        log(`${done} of ${numberOfComputers} computers`, 'info')
        let conn = await makeConnection(server);
        if(!conn){
            done++;
            log(`[${server["IP Address"]}] [${server.Name}] Unable to connect to server`,'error');
            continue;
        }
        await scanComputer(conn, server["OS Type"], false);
        success++;
        done++;
        await conn.close();
    }
    await pressEnter();
    Home();
}


export {scanComputers}