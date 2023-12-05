import { scanComputer } from "../modules/computer/scan";
import runningDB, { ServerInfo } from "../modules/util/db"; 
import { options } from "../modules/util/options";
import { SSH2CONN, makeConnection, makePermanentConnection } from "../modules/util/ssh_utils";

let ssh_connections:SSH2CONN[] = []
let ipMap:Map<string, options> = new Map()
setInterval(async ()=>{
    const computers = await runningDB.readComputers();
    computers.forEach(async (server)=>{
        let index = ssh_connections.findIndex((v)=> v.ipaddress == server["IP Address"])
        if(index != -1){
            return;
        }

        let conn = await makePermanentConnection(server,true, false);
        if(!conn) return;
        ssh_connections.push(conn);
        ipMap.set(server["IP Address"], server["OS Type"])
    })
}, 5000)

let generatedFiles:Map<string,string> = new Map();

while(true){
    ssh_connections.forEach(async (conn)=>{
        var host = conn.config[0].host;
        if(!host) {
            console.log("No host found");
            return;
        }
        var os = ipMap.get(host);
        if(!os){
            console.log("No os found")
            return;
        }
        let scan = await scanComputer(conn, os, false );
        generatedFiles.set(host, scan);
    })
}


import express from 'express';

const app = express();


// app.get()





