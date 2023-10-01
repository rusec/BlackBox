const ssh2 = require('ssh2-promise')
const { detect_os } = require('../detect_os')


async function pingSSH(ip, username, password) {
    try {
        const sshConfig = {
            host: ip,
            username: username,
            password: password,
            authHandler: ['password'],
            reconnect: false,
            keepaliveInterval: 0,
            readyTimeout: 2000,
        }
        const ssh = new ssh2(sshConfig)
        await ssh.connect()
        let os = await detect_os(ssh)
        await ssh.close();
        return os || true;
    } catch (error) {
        return false;
    }



}


module.exports = {
    pingSSH
}