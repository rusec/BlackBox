const colors = require('colors')
const pkg = require("colors");
const { bold } = pkg;

/**
 *
 * @param {String} message
 * @param {String} type "debug","log","warn","error","info","success"
 * @param {Boolean} override
 */
var log = (message, type = "debug", override = false) => {
    let t;
    switch (type.toLowerCase()) {
        default:
        case "log":
            t = "[LOG] ".blue;
            break;
        case "debug":
            t = "[DEBUG] ".green;
            break;
        case "warn":
            t = "[WARNING] ".yellow;
            break;
        case "error":
            t = "[ERROR] ".red;
            break;
        case "info":
            t = "[MESSAGE] ".magenta;
            break;
        case "success":
            t = bold("[SUCCESS]".green);
            break;
    }

    console.log(t, message);
};
var error = (message) => {
    console.log("[ERROR] ".red, message);
};
var success = (message) => {
    console.log(bold("[SUCCESS]".green), message);
};
var info = (message) => {
    console.log("[MESSAGE] ".magenta, message);
};


module.exports = { log, error, success, info };