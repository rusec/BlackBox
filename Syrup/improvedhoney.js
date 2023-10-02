// TODO: try to get the net and fs modules quick-installed onto the ccdc machines as fast as possible 
// (as well as nodejs if not run on server)
const net = require('net');
const fs = require('fs');

// TODO: ask user for which port the honeypot should listen on, 22 is ssh
const PORT = 22;
const LOG_FILE = 'honeylog.txt';

// TODO: add dynamic banner based on operating system of in-scope machine (USE A FILE CONTAINING DIFF BANNERS)
// use OS detection to select correct banner from file
const CUSTOM_BANNER = '';

const WHITELIST_FILE = 'whitelist.txt';
const BLACKLIST_FILE = 'blacklist.txt';

const whitelistedIPs = loadIPList(WHITELIST_FILE);
const blacklistedIPs = loadIPList(BLACKLIST_FILE);

async function loadSSHBanner(path) {
  const file = fs.readFile(path, 'utf8', (error, data) => {
    if(error) {
      console.error(`Error loading SSH Banner list from ${path}: ${error.message}`);
      return;
    }
    console.log(JSON.parse(data));
  });
}

const server = net.createServer((socket) => {

  const remoteAddress = socket.remoteAddress;
  const remotePort = socket.remotePort;

  console.log(`Attacker connected from: ${remoteAddress}:${remotePort}`);
  
  socket.write(CUSTOM_BANNER);

  // check if ip is in blacklist/whitelist
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(remoteAddress)) {
    console.log(`Whitelisted IP check: Connection from ${remoteAddress} is not whitelisted.`);
    socket.end();
    return;
  }

  if (blacklistedIPs.includes(remoteAddress)) {
    console.log(`Blacklisted IP check: Connection from ${remoteAddress} is blacklisted.`);
    socket.end();
    return;
  }

  //const test = socket.process.platform

  let attackerVersion = '';
  socket.on('data', (data) => {

    attackerVersion += data.toString();

    if (attackerVersion.includes('\r\n')) {
      
      //TODO: testing on whether this returns the correct info
      const sshVersion = attackerVersion.split('\r\n')[0].trim();

      logAttackerDetails(socket.remoteFamily, remoteAddress, remotePort, sshVersion);

      // fake login this would be funny as hell if they fall for it
      socket.write('Username: ');

      // sanitize this as much as possible??
      socket.once('data', (username) => {

        username = username.toString().trim();
        console.log(`Received username from ${remoteAddress}:${remotePort}: ${username}`);

        socket.write('Password: ');

        socket.once('data', (password) => {
          password = password.toString().trim();
          console.log(`Received password from ${remoteAddress}:${remotePort}: ${password}`);
          
          socket.write('Access Denied\r\n'); // TODO: stall as long as possible so red team gets stuck etc.

          socket.end();
        });
      });
    }
  });
});

function logAttackerDetails(protocol, ip, port, sshVersion) {
  const logEntry = `Attacker connected from ${protocol} ${ip}:${port}  SSH: ${sshVersion}\n`;
  fs.appendFile(LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error(`Error writing details to ${LOG_FILE}: ${err}`);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Honeypot listening on port ${PORT}...`);
});
