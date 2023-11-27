const express = require('express');
const colors = require("colors");
const { default: helmet } = require('helmet');
const isbot = require('isbot')
const app = express();
const readline = require('readline')
const fs = require('fs')
const port = 80;
const Table = require('table');


const dangerousEndpoints = [
    '/api',
    '/uploads',
    '/users',
    '/files',
    '/file',
    '/upload',
    '/cgi-bin',
    "/bin",
    "bash",
    ".sh"
]

/**
 * @type {Map<string, ip_document>}
 */
const ips = new Map();

/**
 * @typedef ip_document
 * @property host {string} Host 
 * @property is_browser {number} is the ip a browser
 * @property Chrome {number}    is the ip chrome
 * @property reqs {number}  total number of requests
 * @property high_req {Date}    The average high per min
 * @property UA_missing {number}    requests that were sent without user-agent
 * @property rec_ua {string} the most recent user agent
 * @property dangerous_reqs {number}    the amount of req made to dangerous endpoints
 * @property aver_btw_res {number}  the running average of requests a min
 * @property is_bot {boolean}   was use tagged as a bot
 * @property rec_req_to {string}   Recent endpoint accessed
 * @property last_req {Date}    Last request made
 * @property rec_requests {Date[]}    most recent request dates
 * @property flagged_request {string[]}    most recent request dates
 * 
 */
/**
 * 
 * @param {string} ip 
 * @returns {ip_document}
 */
const createNewIp = (ip) => {
    return {
        host: ip,
        UA_missing: 0,
        is_browser: 0,
        Chrome: 0,
        aver_btw_res: 0,
        high_req: 0,
        reqs: 0,
        rec_req_to: '',
        is_bot: false,
        last_req: new Date(),
        dangerous_reqs: 0,
        rec_ua: '',
        rec_requests: [],
        flagged_request: []
    }
}




/**
 * 
 * @param {express.Request} req 
 */
function parseReq(req, critical_endpoint) {
    var parsedRequest = '---------------------------------------------------------------------------------------------------------------\n';
    parsedRequest += `${req.method} request from ${req.socket.remoteAddress}`.bgGreen + "\n"
    parsedRequest += `Endpoint: ${req.originalUrl}\n`

    parsedRequest += colors.bold(`Headers from request\n`)

    const headers = Object.keys(req.headers)
    for (let i = 0; i < headers.length; i++) {
        const element = headers[i];
        parsedRequest += element + ":" + (req.headers[element]) + "\n";
    }


    parsedRequest += "\n" + `Flags`.bgRed + "\n"
    parsedRequest += `Time: ${new Date().toUTCString()}\n`

    parsedRequest += `UserAgent: ${req.headers['user-agent'] ? true : false}\n`
    parsedRequest += `Is Browser: ${req.headers['user-agent'] && req.headers['user-agent'].toLowerCase().includes('mozilla') ? true : false}\n`
    parsedRequest += `Chrome: ${req.headers['sec-ch-ua']?.toLowerCase().includes('chromium') ? true : false}\n`
    parsedRequest += `Critical Endpoint: ${critical_endpoint ? 'true'.red : false}\n`
    parsedRequest += '---------------------------------------------------------------------------------------------------------------\n';


    let curr_ip = ips.get(req.socket.remoteAddress);
    if (!curr_ip) {
        curr_ip = createNewIp(req.socket.remoteAddress)
    }
    curr_ip.reqs++;
    !req.headers['user-agent'] != undefined && curr_ip.UA_missing++;
    req.headers['user-agent'] != undefined && req.headers['user-agent'].toLowerCase().includes('mozilla') && curr_ip.is_browser++;
    curr_ip.is_bot = curr_ip.is_bot || (req.headers['user-agent'] != undefined && isbot(req.headers['user-agent']))
    req.headers['sec-ch-ua']?.toLowerCase().includes('chromium') && curr_ip.Chrome++;
    (critical_endpoint || !req.headers['user-agent'] || (req.headers['user-agent'] != undefined && isbot(req.headers['user-agent']))) && curr_ip.dangerous_reqs++;
    curr_ip.rec_ua = req.headers['user-agent']
    curr_ip.rec_req_to = req.originalUrl
    curr_ip.rec_requests.push(Date.now())


    const cutoffTime = Date.now() - (60 * 1000);
    while (curr_ip.rec_requests[0] && curr_ip.rec_requests[0] < cutoffTime) {
        curr_ip.rec_requests.shift();
    }


    curr_ip.aver_btw_res = Math.round((curr_ip.rec_requests.length / 60) * 100) / 100; // Requests per second (assuming a 60-second window)
    if (curr_ip.aver_btw_res > curr_ip.high_req) {
        curr_ip.high_req = curr_ip.aver_btw_res
    }

    if (critical_endpoint || !req.headers['user-agent'] || (req.headers['user-agent'] != undefined && isbot(req.headers['user-agent']))) {
        curr_ip.flagged_request.push(parsedRequest)
    }
    ips.set(req.socket.remoteAddress, curr_ip)

    return parsedRequest
}

app.use(helmet())

app.use((req, res, next) => {
    res.setHeader('Server', "Apache/2.4.2 (Unix)")
    let dangerous = false;
    dangerousEndpoints.forEach(v => {
        if (dangerous) return;
        if (req.originalUrl.includes(v)) dangerous = true;
    })
    console.log(parseReq(req, dangerous));
    next();
})

app.get('/', (req, res) => {

    res.send(`<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
    <html>
    <head>
        <title>Welcome</title>
    </head>
    <body>
        <h1>Welcome to Uploads Server</h1>
        <p>This server was created to upload files Only to be used for development</p>
        <hr>
        <address>Apache Server at 127.0.0.1 Port ${port}</address>
    </body>
    </html>`);
});


app.post('/upload', (req, res) => {


    res.setHeader('Server', "Apache/2.4.2 (Unix)")

    res.send(req.is('multipart/form-data') ? `Success` : `Failed Only Accepts Html`);
});
app.get('/cgi-bin', (req, res) => {


    res.send(``);
});
app.get('/cgi-bin/*', (req, res) => {


    res.send(``);
});
app.get('/upload', (req, res) => {


    res.send(`<!DOCTYPE html>
    <html>
    <head>
      <title>File Upload</title>
    </head>
    <body>
      <h1>Upload a File</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" id="file" accept=".html" required>
        <button type="submit">Upload</button>
      </form>
    </body>
    </html>`);
});




app.use((req, res) => {
    res.status(404)
    res.send(`<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
    <html>
    <head>
        <title>404 Not Found</title>
    </head>
    <body>
        <h1>Not Found</h1>
        <p>The requested URL was not found on this server.</p>
        <hr>
        <address>Apache Server at 127.0.0.1 Port ${port}</address>
    </body>
    </html>`);
});


app.use((err, req, res) => {
    res.status(500)
    res.send(`<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
    <html>
    <head>
        <title>500 Internal Server Error</title>
    </head>
    <body>
        <h1>Not Found</h1>
        <p>The requested URL was not found on this server.</p>
        <hr>
        <address>Apache Server at 127.0.0.1 Port ${port}</address>
    </body>
    </html>`);
});



// HTTP SET UP
app.listen(port, () => {
    console.log(`Server is running on port ${port}, Press P to print logs`);
});

if(fs.existsSync("sslcert/server.key")){
    var privateKey = fs.readFileSync('sslcert/server.key').toString();
    var certificate = fs.readFileSync('sslcert/server.crt').toString();
    
    var credentials = {key: privateKey, cert: certificate};
    
    var server = http.createServer(credentials,app);
    
    server.listen(443);
    console.log(`Server is running on port ${443} HTTPS, Press P to print logs`);
    
}






setInterval(function () {
    printIps()
}, 30000)


async function printIps() {

    var ips_array = []
    ips.forEach(ip => {
        ips_array.push({
            'host ip': ip.host,
            'UA_miss': ip.UA_missing,
            'Browser': ip.is_browser,
            'Chrome': ip.Chrome,
            'Avg Req/s': ip.aver_btw_res,
            'Hi Avg/s': ip.high_req,
            'Reqs': ip.reqs,
            'Recent Endpoint': ip.rec_req_to,
            'Is Bot': ip.is_bot,
            'Last Req': ip.last_req,
            "Flagged Res": ip.dangerous_reqs,
            'Most Recent UA used': ip.rec_ua
        })
    })
    if (ips_array.length === 0) {
        return;
    }
    console.table(ips_array)

}


// Create a readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});




// Listen for key presses
rl.input.on('data', (key) => {
    // Call the function when a key is pressed
    onKeyPress(key.toString().trim());
});

// Define a function to be executed when a key is pressed
async function onKeyPress(key) {
    if (key.toLowerCase() !== 'p')
        return;
    let data = []
    const headerRow = ['Host', 'UA_miss', 'Browser', 'Chrome', 'Avg Req/s', 'Hi Avg/s', 'Reqs', 'Recent Endpoints', 'Is Bot', 'Last Req', 'Flagged Res', 'Most Recent UA used'];
    data.push(headerRow)
    var ips_array = []
    let file = '\n'
    let flaggedReqests = []

    ips.forEach(ip => {
        const rowData = [ip.host, ip.UA_missing, ip.is_browser, ip.Chrome, ip.aver_btw_res, ip.high_req, ip.reqs, ip.rec_req_to, ip.is_bot, ip.last_req, ip.dangerous_reqs, ip.rec_ua];
        data.push(rowData);
        ip.flagged_request.forEach(r => flaggedReqests.push(r))
    })

    const table = Table.table(data);
    file += table

    file += `\n Flagging enpoints ${dangerousEndpoints.toString()}`

    file += `\n\n FLAGGED REQUESTS \n`
    flaggedReqests.forEach(r => {

        file += removeANSIColorCodes(r) + "\n\n"
    })


    fs.writeFileSync("./request.log", file, 'utf-8')
    // console.log(file);
}




function removeANSIColorCodes(inputString) {
    // Define a regular expression to match ANSI color codes
    const colorCodePattern = /\x1B\[[0-9;]*[A-Za-z]/g;

    // Use the replace method to remove the color codes
    const stringWithoutColor = inputString.replace(colorCodePattern, '');

    return stringWithoutColor;
}