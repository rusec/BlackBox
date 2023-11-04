const fs = require('fs');
const net = require('net');
const readline = require('readline');
const os = require('os');
const path = require('path');
const moment = require('moment');

var cmdArgs = process.argv;

var PORT = 0;

const platform = process.platform;

const esearch = false;
var rangeset = false;

const totalports = 65535;

var POTS = [];

//var CUSTOM_BANNER = '';

const LOG_FILE = 'syrup.log';

//const WHITELIST_FILE = path.join(__dirname, '..', 'resources', 'lists', 'whitelist.txt');

//const BLACKLIST_FILE = path.join(__dirname, '..', 'resources', 'lists', 'blacklist.txt');

if(cmdArgs != null) {
    if(cmdArgs[2].includes(':9200')) {
      esearch = true;
      const { client } = require('@elastic/elasticsearch');
      if(cmdArgs[3].includes('-')) {
        var range = cmdArgs[3].split('-');
        rangeset = true;
      } else {
        PORT = cmdArgs[3];
      }
      PORT = cmdArgs[3];
    } else if (cmdArgs[2].includes('-')){
      var range = cmdArgs[2].split('-');
      rangeset = true;
    } else {
      PORT = cmdArgs[2];
    }
}

function getOS() {
  fs.readFile('/etc/os-release', 'utf8', (err, data) => {
  if (err) throw err
  const lines = data.split('\n')
  const releaseDetails = {}
  lines.forEach((line, index) => {
    const words = line.split('=')
    releaseDetails[words[0].trim().toLowerCase()] = words[1].trim()
  })
  return releaseDetails.id;
  });
}

const bannerMap = new Map();

async function lazyReadBanner(path) {

  try {
    const fileStream = fs.createReadStream(path);
  } catch(error) {
    console.error(`Error opening file in path: ${path}. ${error}`);
  }

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    arr = line.split('  ');
    bannerMap.set(arr[0], arr[1]);
  }

}

function logAttackerDetails(protocol, ip, port, cmdArr, sshVersion) {

  var logEntry = '';

  if(sshVersion === undefined) {
    logEntry = `Attacker connected from ${protocol} ${ip}:${port} at ${moment().format("MM/DD/YYYY HH:mm:ss")}\n`;
  } else {
    logEntry = `Attacker connected from ${protocol} SSH: ${sshVersion} at ${moment().format("MM/DD/YYYY HH:mm:ss")}\n`;
  }

  if(typeof cmdArr !== undefined) { 
    cmdArr.forEach(element => {
      logEntry += `\t${element}\n`;
    });
  }
    
  if(esearch == true) {
    client.index({
      index: 'Attackers',
      body: {
        title: 'Bandit',
        content: logEntry
      }
    });
  } else {
    fs.appendFile(LOG_FILE, logEntry, (error) => {
      if (error) {
        console.error(`Error writing details to ${LOG_FILE}: ${error}`);
      }
    });
  }
  
}

if(rangeset) {
  var i = parseInt(range[0]);
  while(i <= parseInt(range[1])) {
    POTS.push(makelisten(i));
    i += 1;
  }

  console.log(`Syrup listening on ports ${range[0]}-${range[1]}`);

} else {
  POTS.push(makelisten(PORT));
}

const baseUser = 'luffy';

function filesystem(OS) {
  switch (OS.toLowerCase()) {
    case 'win32':
      return `C:\\Users\\${baseUser}>`;
    break;
    case 'linux':
      const distro = getOS();
      return `${baseUser}@${distro}:~$ `;
    break;
    case 'freebsd':
      return '$ ';
    break;
    case 'openbsd':
      return '$ ';
    break;
    case 'centos':
      return '$ ';
    break;
  } 
}

function makelisten(PORT) {
  var server = net.createServer((socket) => {
  
    var cmdArr = [];
  
    var remoteAddress = socket.remoteAddress;
    var remotePort = socket.remotePort;
  
    let attackerversion = ''
    
    socket.write(filesystem(platform));
  
    socket.on('data', (conn) => {
      if(PORT == 22) {
        attackerversion += conn.toString();
    
        if(attackerversion.includes('\r\n')) {
          var sshVersion = attackerversion.split('\r\n')[0].trip();
          logAttackerDetails(socket.remoteFamily, socket.remoteAddress, socket.remotePort, undefined, sshVersion);
        }
      }
  
      if(platform == 'win32') {
        if(conn.toString().trim() == 'dir') {
          socket.write(` Volume in drive C has no label.\n Volume Serial Number is 4B8C-2357\n\n Directory of C:\\Users\\${baseUser}\n\n11/03/2023  06:33 PM    <DIR>          .\n11/03/2023  06:33 PM    <DIR>          ..\n10/02/2023  06:12 PM               518 passwords\n               1 File(s)          518 bytes\n              2 Dir(s)    1,629,779,968 bytes free\n`);
        } else if(conn.toString().trim() == 'whoami') {
          socket.write(`${os.hostname()}\\${baseUser}\n`);
        } else if(conn.toString().trim() == 'type') {
          socket.write('The syntax of the command is incorrect.\n\n');
        } else if(conn.toString().trim().split(' ')[0] == 'type') {
          if(conn.toString().trim().split(' ')[1] == 'passwords') {
            socket.write('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8\n05e504e6df434cf63fd510236bf58ea791bc428b\n4f25c954f1aaea7841cab647d4894e26d864a99f\n\n');
          } else {
            socket.write('The syntax of the command is incorrect.\n');
          }
        } else {
          socket.write(`\'${conn.toString().trim().split(' ')[0]}\' is not recognized as an internal or external command, operable program or batch file.\n\n`);
        }
      } else {
        if(conn.toString().trim() == 'ls' || conn.toString().trim().split(' ')[0] == 'ls') {
          socket.write(`passwords\n`);
        } else if(conn.toString().trim().split(' ')[0] == 'cat') {
          if(conn.toString().trim().split(' ')[1] == 'passwords') {
            socket.write('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8\n05e504e6df434cf63fd510236bf58ea791bc428b\n4f25c954f1aaea7841cab647d4894e26d864a99f\n');
          }
        } else {
          socket.write(`${conn.toString().trim().split(' ')[0]}: command not found\n`);
        }
      }

      cmdArr.push(conn.toString().trim());
  
      socket.write(filesystem(platform));
  
    });

    socket.on('end', (end) => {
      if(PORT != 22) {
        logAttackerDetails(socket.remoteFamily, socket.remoteAddress, socket.remotePort, cmdArr, undefined);
      }
    });

  });

  server.listen(PORT, () => {
    if(!rangeset) {
      console.log(`Syrup listening on ${PORT}...`);
    }
  });

  return server;
}