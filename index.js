require('dotenv').config();

const Logger = require('./src/log');
const Cronman = require('./src/cron');
const Executor = require('./src/exec');

module.exports = class {
    constructor(service = 'Unknown Service', auth = process.env.ZYTEKARON_AUTH) {
        this.log = new Logger(service, auth);
        this.cron = new Cronman(service, auth);
        this.exec = new Executor(service, auth);
    }
};
