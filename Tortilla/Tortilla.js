const clear = require('clear');
const { home } = require('./front/home')
const checkPassword = require('./modules/util/checkPassword')

const run = async function () {
    await clear();
    await checkPassword();
    await home();
}


run()